import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { FitnessAlert } from "../types/fitnessProfile";

interface FitnessAlertsSectionProps {
  alerts: FitnessAlert[];
  onAlertClick?: (alert: FitnessAlert) => void;
}

export const FitnessAlertsSection: React.FC<FitnessAlertsSectionProps> = ({
  alerts,
  onAlertClick,
}) => {
  if (!alerts || alerts.length === 0) return null;

  const getAlertStyles = (type: FitnessAlert["type"]) => {
    switch (type) {
      case "danger":
        return {
          cardBorder: "border-rose-200 dark:border-rose-900/60",
          cardBg: "bg-rose-50/50 dark:bg-rose-950/20",
          iconBg: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
          badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
          btnColor: "text-rose-700 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100",
          icon: AlertCircle,
        };
      case "warning":
        return {
          cardBorder: "border-amber-200 dark:border-amber-900/60",
          cardBg: "bg-amber-50/50 dark:bg-amber-950/20",
          iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
          badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
          btnColor: "text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100",
          icon: AlertTriangle,
        };
      case "success":
      default:
        return {
          cardBorder: "border-emerald-200 dark:border-emerald-900/60",
          cardBg: "bg-emerald-50/50 dark:bg-emerald-950/20",
          iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
          badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
          btnColor: "text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100",
          icon: CheckCircle2,
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Fitness Intelligence Alerts
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Cập nhật thời gian thực từ AI & Hệ thống
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {alerts.map((alert) => {
          const styles = getAlertStyles(alert.type);
          const Icon = styles.icon;
          return (
            <div
              key={alert.id}
              className={`flex flex-col justify-between rounded-2xl border ${styles.cardBorder} ${styles.cardBg} p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 ${styles.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${styles.badgeBg}`}>
                    {alert.count.toLocaleString()} học viên
                  </span>
                </div>

                <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                  {alert.title}
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {alert.description}
                </p>
              </div>

              <div className="mt-4 border-t border-black/5 pt-3 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => onAlertClick && onAlertClick(alert)}
                  className={`inline-flex items-center gap-1 text-xs font-bold ${styles.btnColor}`}
                >
                  {alert.ctaText}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
