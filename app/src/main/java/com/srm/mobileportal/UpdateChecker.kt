package com.srm.mobileportal

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import android.widget.Toast
import androidx.core.content.FileProvider
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Checks GitHub Releases for a newer APK version and lets the user
 * download and install updates directly from inside the app.
 */
class UpdateChecker(private val activity: Activity) {

    private val executor = Executors.newSingleThreadExecutor()

    private data class ReleaseInfo(
        val version: String,
        val notes: String,
        val apkUrl: String
    )

    fun checkForUpdates() {
        executor.execute {
            val release = fetchLatestRelease() ?: return@execute
            if (!isNewerVersion(release.version, BuildConfig.VERSION_NAME)) {
                return@execute
            }
            activity.runOnUiThread {
                if (!activity.isFinishing && !activity.isDestroyed) {
                    showUpdateDialog(release)
                }
            }
        }
    }

    private fun fetchLatestRelease(): ReleaseInfo? {
        return runCatching {
            val conn = (URL(PortalConfig.GITHUB_LATEST_RELEASE_URL).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8000
                readTimeout = 8000
                setRequestProperty("Accept", "application/vnd.github+json")
                setRequestProperty("User-Agent", "SRMMobilePortal-Android")
            }
            if (conn.responseCode != HttpURLConnection.HTTP_OK) {
                conn.disconnect()
                return null
            }

            val body = conn.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
            conn.disconnect()

            val json = JSONObject(body)
            val tag = json.optString("tag_name", "").trim().removePrefix("v").removePrefix("V")
            if (tag.isBlank()) return null

            val notes = json.optString("body", "").trim()
            val assets = json.optJSONArray("assets") ?: return null
            var apkUrl: String? = null
            for (i in 0 until assets.length()) {
                val asset = assets.getJSONObject(i)
                val name = asset.optString("name", "")
                if (name.endsWith(".apk", ignoreCase = true)) {
                    apkUrl = asset.optString("browser_download_url", "")
                    break
                }
            }
            if (apkUrl.isNullOrBlank()) return null

            ReleaseInfo(version = tag, notes = notes, apkUrl = apkUrl)
        }.getOrNull()
    }

    private fun showUpdateDialog(release: ReleaseInfo) {
        val message = release.notes.ifBlank {
            activity.getString(R.string.update_default_notes)
        }
        MaterialAlertDialogBuilder(activity)
            .setTitle(activity.getString(R.string.update_title, release.version))
            .setMessage(message)
            .setNegativeButton(R.string.update_later, null)
            .setPositiveButton(R.string.update_now) { _, _ ->
                downloadAndInstall(release)
            }
            .show()
    }

    private fun downloadAndInstall(release: ReleaseInfo) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            !activity.packageManager.canRequestPackageInstalls()
        ) {
            Toast.makeText(activity, R.string.update_install_permission, Toast.LENGTH_LONG).show()
            val intent = Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:${activity.packageName}")
            )
            activity.startActivity(intent)
            return
        }

        Toast.makeText(
            activity,
            activity.getString(R.string.update_downloading, release.version),
            Toast.LENGTH_SHORT
        ).show()

        executor.execute {
            val apkFile = downloadApk(release.apkUrl, release.version)
            activity.runOnUiThread {
                if (activity.isFinishing || activity.isDestroyed) return@runOnUiThread
                if (apkFile != null) {
                    launchApkInstaller(apkFile)
                } else {
                    Toast.makeText(activity, R.string.update_download_failed, Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun downloadApk(apkUrl: String, version: String): File? {
        return runCatching {
            val dir = activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: return null
            if (!dir.exists()) dir.mkdirs()

            val outFile = File(dir, "srm-portal-v$version.apk")
            val conn = (URL(apkUrl).openConnection() as HttpURLConnection).apply {
                instanceFollowRedirects = true
                connectTimeout = 15000
                readTimeout = 30000
                setRequestProperty("User-Agent", "SRMMobilePortal-Android")
            }
            if (conn.responseCode != HttpURLConnection.HTTP_OK) {
                conn.disconnect()
                return null
            }

            conn.inputStream.use { input ->
                FileOutputStream(outFile).use { output ->
                    input.copyTo(output)
                }
            }
            conn.disconnect()
            outFile
        }.getOrNull()
    }

    private fun launchApkInstaller(apkFile: File) {
        val apkUri = FileProvider.getUriForFile(
            activity,
            "${activity.packageName}.fileprovider",
            apkFile
        )
        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        activity.startActivity(installIntent)
    }

    companion object {
        fun isNewerVersion(remote: String, current: String): Boolean {
            val rParts = remote.split(".").map { it.filter(Char::isDigit).toIntOrNull() ?: 0 }
            val cParts = current.split(".").map { it.filter(Char::isDigit).toIntOrNull() ?: 0 }
            val maxLen = maxOf(rParts.size, cParts.size)
            for (i in 0 until maxLen) {
                val r = rParts.getOrElse(i) { 0 }
                val c = cParts.getOrElse(i) { 0 }
                if (r != c) return r > c
            }
            return false
        }
    }
}
