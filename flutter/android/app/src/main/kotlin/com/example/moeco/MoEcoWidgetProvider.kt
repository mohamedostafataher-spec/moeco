package com.example.moeco

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetProvider

/// F8: home-screen widget. Reads the strings the Flutter side writes via
/// HomeWidget.saveWidgetData and shows them. Display-only.
class MoEcoWidgetProvider : HomeWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences
    ) {
        for (id in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.moeco_widget)
            views.setTextViewText(
                R.id.widget_title,
                widgetData.getString("widget_title", "MoEco")
            )
            views.setTextViewText(
                R.id.widget_line1,
                widgetData.getString("widget_line1", "")
            )
            views.setTextViewText(
                R.id.widget_line2,
                widgetData.getString("widget_line2", "")
            )
            views.setTextViewText(
                R.id.widget_line3,
                widgetData.getString("widget_line3", "")
            )
            appWidgetManager.updateAppWidget(id, views)
        }
    }
}
