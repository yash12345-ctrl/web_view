package com.srm.mobileportal

import android.content.Context
import android.net.Uri
import android.util.Base64
import android.webkit.WebView

/**
 * Loads the bundled mobile-responsive CSS and JS assets and injects them into
 * SRM Student Portal pages after they finish loading.
 */
class AssetInjector(private val context: Context) {

    private val encodedCss: String by lazy {
        val rawCss = readAssetText(PortalConfig.MOBILE_CSS_ASSET)
        Base64.encodeToString(rawCss.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
    }

    private val mobileJs: String by lazy {
        readAssetText(PortalConfig.MOBILE_JS_ASSET)
    }

    fun injectIfPortalPage(webView: WebView, url: String?) {
        val host = url?.let { Uri.parse(it).host }?.lowercase() ?: return
        if (!host.endsWith(PortalConfig.PORTAL_DOMAIN_SUFFIX)) {
            return
        }

        val cssInjectionScript = """
            (function() {
                if (!document.getElementById('${PortalConfig.STYLE_TAG_ID}')) {
                    var style = document.createElement('style');
                    style.id = '${PortalConfig.STYLE_TAG_ID}';
                    style.type = 'text/css';
                    style.textContent = decodeURIComponent(escape(window.atob('$encodedCss')));
                    (document.head || document.documentElement).appendChild(style);
                }
            })();
        """.trimIndent()

        webView.evaluateJavascript(cssInjectionScript, null)
        if (mobileJs.isNotBlank()) {
            webView.evaluateJavascript(mobileJs, null)
        }
    }

    private fun readAssetText(assetPath: String): String {
        return runCatching {
            context.assets.open(assetPath).bufferedReader(Charsets.UTF_8).use { it.readText() }
        }.getOrDefault("")
    }
}
