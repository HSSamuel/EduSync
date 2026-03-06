import React, { useState, useEffect } from "react";
import PremiumEmptyState from "./PremiumEmptyState";
import { apiFetch } from "../utils/api";
import {
  Receipt,
  DollarSign,
  Send,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  LayoutList,
  List,
} from "lucide-react";

const FinanceTab = ({ isAdmin, isParent, isStudent, students }) => {
  const [invoices, setInvoices] = useState([]);
  const [formData, setFormData] = useState({
    student_id: "",
    title: "",
    amount: "",
    due_date: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompactView, setIsCompactView] = useState(false); // 👈 Density Toggle State

  useEffect(() => {
    fetchInvoices();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("payment_success") === "true") {
      alert("🎉 Payment Successful! Your receipt is being processed securely.");
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await apiFetch("/finance/invoices", { method: "GET" });
      if (res.ok) setInvoices(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const onCreateInvoice = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const res = await apiFetch("/finance/invoices", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("✅ Invoice generated and emailed!");
        setFormData({ student_id: "", title: "", amount: "", due_date: "" });
        fetchInvoices();
      } else {
        const data = await res.json().catch(() => ({}));
        alert("❌ " + (data.error || "Failed to generate invoice."));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePayment = async (invoice_id) => {
    setIsProcessing(true);
    try {
      const res = await apiFetch(`/finance/invoices/${invoice_id}/checkout`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert("❌ " + (data.error || "Failed to initialize payment gateway."));
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Something went wrong while initializing payment.");
      setIsProcessing(false);
    }
  };

  const getStatusPill = (status) => {
    const val = (status || "").toLowerCase();
    if (val === "paid") {
      return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    }
    if (val === "overdue") {
      return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    }
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
  };

  // ✅ Basic empty-state
  if (!isAdmin && !isParent && !isStudent) return null;

  return (
    <div className="animate-fade-in space-y-8">
      {isAdmin && (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-xl">
              <Receipt size={24} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Generate Invoice
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a fee invoice for a student and email it automatically.
              </p>
            </div>
          </div>

          <form onSubmit={onCreateInvoice} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  Student
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) =>
                    setFormData({ ...formData, student_id: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  disabled={isGenerating}
                >
                  <option value="">Select Student</option>
                  {students?.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.full_name} ({s.class_grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Tuition Fee"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  Amount
                </label>
                <div className="relative">
                  <DollarSign
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="e.g. 50000"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full md:w-auto px-8 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-md shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Generate & Email
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xl font-bold text-gray-900 dark:text-white">
            Invoices
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View and manage fee invoices.
          </p>
        </div>

        <button
          onClick={() => setIsCompactView((v) => !v)}
          aria-label="Toggle table density"
          title="Toggle Compact View"
          className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-colors"
        >
          {isCompactView ? <LayoutList size={18} /> : <List size={18} />}
        </button>
      </div>

      {invoices.length === 0 ? (
        <PremiumEmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Invoices generated by the admin will appear here."
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-auto max-h-[65vh] w-full">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
                <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th
                    className={`${
                      isCompactView ? "p-2.5" : "p-4"
                    } font-bold border-b border-gray-200 dark:border-gray-700`}
                  >
                    Student
                  </th>
                  <th
                    className={`${
                      isCompactView ? "p-2.5" : "p-4"
                    } font-bold border-b border-gray-200 dark:border-gray-700`}
                  >
                    Title
                  </th>
                  <th
                    className={`${
                      isCompactView ? "p-2.5" : "p-4"
                    } font-bold border-b border-gray-200 dark:border-gray-700`}
                  >
                    Amount
                  </th>
                  <th
                    className={`${
                      isCompactView ? "p-2.5" : "p-4"
                    } font-bold border-b border-gray-200 dark:border-gray-700`}
                  >
                    Due
                  </th>
                  <th
                    className={`${
                      isCompactView ? "p-2.5" : "p-4"
                    } font-bold border-b border-gray-200 dark:border-gray-700`}
                  >
                    Status
                  </th>
                  <th
                    className={`${
                      isCompactView ? "p-2.5" : "p-4"
                    } font-bold border-b border-gray-200 dark:border-gray-700 text-right`}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {invoices.map((inv) => (
                  <tr
                    key={inv.invoice_id}
                    className="hover:bg-blue-50/30 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className={`${isCompactView ? "p-2.5" : "p-4"}`}>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {inv.student_name || inv.full_name || "Student"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {inv.class_grade || ""}
                      </div>
                    </td>

                    <td
                      className={`${isCompactView ? "p-2.5" : "p-4"} font-semibold`}
                    >
                      {inv.title}
                    </td>

                    <td className={`${isCompactView ? "p-2.5" : "p-4"}`}>
                      <span className="inline-flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200">
                        <DollarSign size={14} />
                        {inv.amount}
                      </span>
                    </td>

                    <td className={`${isCompactView ? "p-2.5" : "p-4"}`}>
                      <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Clock size={14} />
                        {inv.due_date
                          ? new Date(inv.due_date).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>

                    <td className={`${isCompactView ? "p-2.5" : "p-4"}`}>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md font-black uppercase tracking-wider border border-transparent text-xs ${getStatusPill(
                          inv.status,
                        )}`}
                      >
                        {inv.status || "pending"}
                      </span>
                    </td>

                    <td
                      className={`${isCompactView ? "p-2.5" : "p-4"} text-right`}
                    >
                      {(isParent || isStudent) &&
                      (inv.status || "").toLowerCase() !== "paid" ? (
                        <button
                          onClick={() => handlePayment(inv.invoice_id)}
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard size={16} />
                              Pay Now
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400">
                          <CheckCircle2 size={16} />
                          {String(inv.status || "").toLowerCase() === "paid"
                            ? "Paid"
                            : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceTab;
