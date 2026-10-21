package ai.appsketch.host

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import kotlin.math.abs

/**
 * Full-screen home of the running guest app. A small draggable bubble floats
 * over it (Reload / Back to AppSketch), like Expo Go's dev menu but always
 * reachable, since a release build has no shake menu.
 */
class GuestActivity : ReactActivity() {
  private var errorView: View? = null

  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
      override fun getReactHost(): ReactHost? = GuestSession.host
    }

  override fun onCreate(savedInstanceState: Bundle?) {
    // A recreated activity (process death) has no guest to show.
    if (GuestSession.host == null) {
      super.onCreate(null)
      finish()
      return
    }
    super.onCreate(null)
    GuestSession.onError = { showError(it) }
    addBubble()
  }

  override fun onDestroy() {
    super.onDestroy()
    if (isFinishing) {
      GuestSession.onError = null
      GuestSession.close()
    }
  }

  private fun dp(v: Float): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, resources.displayMetrics).toInt()

  private val root: FrameLayout
    get() = window.decorView as FrameLayout

  @SuppressLint("ClickableViewAccessibility")
  private fun addBubble() {
    val size = dp(46f)
    val bubble = TextView(this).apply {
      text = "AS"
      setTextColor(Color.WHITE)
      textSize = 13f
      gravity = Gravity.CENTER
      typeface = android.graphics.Typeface.DEFAULT_BOLD
      contentDescription = "AppSketch menu"
      elevation = dp(8f).toFloat()
      alpha = 0.92f
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(Color.parseColor("#111111"))
        setStroke(dp(1.5f), Color.WHITE)
      }
    }
    val params = FrameLayout.LayoutParams(size, size, Gravity.TOP or Gravity.END).apply {
      topMargin = dp(120f)
      rightMargin = dp(12f)
    }
    root.addView(bubble, params)

    // Drag anywhere; a tap (no real movement) opens the menu.
    var downX = 0f
    var downY = 0f
    var startTop = 0
    var startRight = 0
    var moved = false
    bubble.setOnTouchListener { v, e ->
      val lp = v.layoutParams as FrameLayout.LayoutParams
      when (e.actionMasked) {
        MotionEvent.ACTION_DOWN -> {
          downX = e.rawX; downY = e.rawY
          startTop = lp.topMargin; startRight = lp.rightMargin
          moved = false
        }
        MotionEvent.ACTION_MOVE -> {
          val dx = e.rawX - downX
          val dy = e.rawY - downY
          if (abs(dx) > dp(6f) || abs(dy) > dp(6f)) moved = true
          if (moved) {
            lp.topMargin = (startTop + dy).toInt().coerceIn(0, root.height - size)
            lp.rightMargin = (startRight - dx).toInt().coerceIn(0, root.width - size)
            v.layoutParams = lp
          }
        }
        MotionEvent.ACTION_UP -> if (!moved) showMenu()
      }
      true
    }
  }

  private fun showMenu() {
    val title = GuestSession.current?.title ?: "App"
    AlertDialog.Builder(this)
      .setTitle(title)
      .setItems(arrayOf("Reload", "Back to AppSketch")) { _, which ->
        when (which) {
          0 -> reload()
          1 -> finish()
        }
      }
      .show()
  }

  private fun reload() {
    errorView?.let { root.removeView(it) }
    errorView = null
    GuestSession.reload()
  }

  private fun showError(error: Exception) {
    if (isFinishing || errorView != null) return
    val pad = dp(24f)
    val panel = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(pad, pad, pad, pad)
      setBackgroundColor(Color.WHITE)
      isClickable = true
    }
    panel.addView(TextView(this).apply {
      text = "This app couldn't start"
      textSize = 20f
      setTextColor(Color.parseColor("#111111"))
      typeface = android.graphics.Typeface.DEFAULT_BOLD
      gravity = Gravity.CENTER
    })
    panel.addView(TextView(this).apply {
      text = error.message ?: error.toString()
      textSize = 14f
      setTextColor(Color.parseColor("#555555"))
      gravity = Gravity.CENTER
      setPadding(0, dp(12f), 0, dp(20f))
    })
    panel.addView(Button(this).apply {
      text = "Try again"
      setOnClickListener { reload() }
    })
    panel.addView(Button(this).apply {
      text = "Back to AppSketch"
      setOnClickListener { finish() }
    })
    errorView = panel
    root.addView(
      panel,
      FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    )
  }
}
