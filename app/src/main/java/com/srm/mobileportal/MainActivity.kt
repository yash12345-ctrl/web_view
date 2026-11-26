package com.srm.mobileportal

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowInsetsControllerCompat
import com.srm.mobileportal.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var assetInjector: AssetInjector

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            fileUploadCallback?.onReceiveValue(uris)
            fileUploadCallback = null
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true

        assetInjector = AssetInjector(this)

        setupSwipeRefresh()
        setupBottomNavigation()
        setupWebView()
        setupErrorRetry()
        setupBackNavigation()

        if (savedInstanceState != null) {
            binding.portalWebView.restoreState(savedInstanceState)
        }
        val currentUrl = binding.portalWebView.url
        if (currentUrl.isNullOrBlank() || currentUrl == "about:blank") {
            binding.portalWebView.loadUrl(PortalConfig.LOGIN_URL)
        }

        UpdateChecker(this).checkForUpdates()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        binding.portalWebView.saveState(outState)
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setColorSchemeResources(R.color.srm_blue, R.color.srm_gold)
        binding.swipeRefresh.setOnRefreshListener {
            binding.errorLayout.visibility = View.GONE
            val currentUrl = binding.portalWebView.url
            if (currentUrl.isNullOrBlank() || currentUrl == "about:blank") {
                binding.portalWebView.loadUrl(PortalConfig.LOGIN_URL)
            } else {
                binding.portalWebView.reload()
            }
        }
        binding.swipeRefresh.setOnChildScrollUpCallback { _, _ ->
            binding.portalWebView.scrollY > 0
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNav.setOnItemSelectedListener { item ->
            val tabKey = when (item.itemId) {
                R.id.nav_home -> "home"
                R.id.nav_attendance -> "attendance"
                R.id.nav_marks -> "marks"
                R.id.nav_fees -> "fees"
                R.id.nav_menu -> "menu"
                else -> return@setOnItemSelectedListener false
            }
            triggerPortalTab(tabKey)
            true
        }

        binding.bottomNav.setOnItemReselectedListener { item ->
            when (item.itemId) {
                R.id.nav_menu -> triggerPortalTab("menu")
                R.id.nav_home -> triggerPortalTab("home")
                R.id.nav_attendance -> triggerPortalTab("attendance")
                R.id.nav_marks -> triggerPortalTab("marks")
                R.id.nav_fees -> triggerPortalTab("fees")
            }
        }
    }

    private fun triggerPortalTab(tabKey: String) {
        binding.portalWebView.evaluateJavascript(
            "if (window.SRMNav) { window.SRMNav.navigate('$tabKey'); }",
            null
        )
    }

    private fun updateBottomNavVisibility(visible: Boolean) {
        val targetVisibility = if (visible) View.VISIBLE else View.GONE
        if (binding.bottomNav.visibility != targetVisibility) {
            binding.bottomNav.visibility = targetVisibility
            binding.bottomNavDivider.visibility = targetVisibility
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webView = binding.portalWebView

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadsImagesAutomatically = true
            blockNetworkImage = false
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            cacheMode = WebSettings.LOAD_NO_CACHE
        }

        webView.addJavascriptInterface(PortalJsBridge(), "AndroidBridge")

        webView.webViewClient = PortalWebViewClient(
            assetInjector = assetInjector,
            onPageStartedCallback = {
                binding.errorLayout.visibility = View.GONE
                binding.progressBar.visibility = View.VISIBLE
            },
            onPageFinishedCallback = {
                binding.swipeRefresh.isRefreshing = false
                binding.progressBar.visibility = View.GONE
            },
            onMainFrameErrorCallback = {
                binding.swipeRefresh.isRefreshing = false
                binding.progressBar.visibility = View.GONE
                binding.errorLayout.visibility = View.VISIBLE
            }
        )

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                binding.progressBar.progress = newProgress
                binding.progressBar.visibility =
                    if (newProgress in 1..99) View.VISIBLE else View.GONE
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val intent = runCatching {
                    fileChooserParams?.createIntent()
                }.getOrNull() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                }

                return try {
                    fileChooserLauncher.launch(intent)
                    true
                } catch (_: Exception) {
                    fileUploadCallback = null
                    false
                }
            }
        }

        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
            enqueuePortalDownload(url, userAgent, contentDisposition, mimeType)
        }
    }

    private inner class PortalJsBridge {
        @JavascriptInterface
        fun onAuthStateChanged(isLoggedIn: Boolean) {
            runOnUiThread {
                updateBottomNavVisibility(isLoggedIn)
            }
        }
    }

    private fun enqueuePortalDownload(
        url: String,
        userAgent: String,
        contentDisposition: String?,
        mimeType: String?
    ) {
        try {
            val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setMimeType(mimeType)
                CookieManager.getInstance().getCookie(url)?.let { cookies ->
                    addRequestHeader("Cookie", cookies)
                }
                addRequestHeader("User-Agent", userAgent)
                setTitle(fileName)
                setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                )
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            }

            val downloadManager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
            downloadManager.enqueue(request)
            Toast.makeText(
                this,
                getString(R.string.downloading_file, fileName),
                Toast.LENGTH_SHORT
            ).show()
        } catch (_: Exception) {
            Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupErrorRetry() {
        binding.retryButton.setOnClickListener {
            binding.errorLayout.visibility = View.GONE
            val currentUrl = binding.portalWebView.url
            if (currentUrl.isNullOrBlank()) {
                binding.portalWebView.loadUrl(PortalConfig.LOGIN_URL)
            } else {
                binding.portalWebView.reload()
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.portalWebView.canGoBack()) {
                    binding.portalWebView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    override fun onDestroy() {
        binding.portalWebView.apply {
            stopLoading()
            (parent as? ViewGroup)?.removeView(this)
            destroy()
        }
        super.onDestroy()
    }
}
