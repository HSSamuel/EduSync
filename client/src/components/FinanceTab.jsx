import React, { useState, useEffect } from "react";
import PremiumEmptyState from "./PremiumEmptyState";
import {
  Receipt,
  DollarSign,
  Send,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  LayoutList,
  List
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

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
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/finance/invoices`, {
        headers: { jwt_token: token },
      });
      if (res.ok) setInvoices(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const onCreateInvoice = async (e) => {
    e.preventDefault();
    setIsGenerating(true); 
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/finance/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", jwt_token: token },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("✅ Invoice generated and emailed!");
        setFormData({ student_id: "", title: "", amount: "", due_date: "" });
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePayment = async (invoice_id) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/finance/invoices/${invoice_id}/checkout`,
        {
          method: "POST",
          headers: { jwt_token: token },
        },
      );

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert("❌ " + (data.error || "Failed to initialize payment gateway."));
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

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
                Issue Digital Invoice
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generate bills and alert parents via email.
              </p>
            </div>
          </div>

          <form
            onSubmit={onCreateInvoice}
            className="grid grid-cols-1 md:grid-cols-12 gap-4"
          >
            <div className="md:col-span-4 relative">
              <select
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium cursor-pointer disabled:opacity-50"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                required
                disabled={isGenerating}
                aria-label="Select Student"
              >
                <option value="">-- Select Student --</option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.full_name} ({s.class_grade})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3 relative">
              <input
                type="text"
                placeholder="Description (e.g., Tuition)"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium disabled:opacity-50"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={isGenerating}
                aria-label="Invoice Description"
              />
            </div>
            <div className="md:col-span-2 relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="number"
                placeholder="Amount"
                className="w-full pl-9 pr-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium disabled:opacity-50"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                min="1"
                disabled={isGenerating}
                aria-label="Invoice Amount"
              />
            </div>
            <div className="md:col-span-2 relative">
              <input
                type="date"
                className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium cursor-pointer disabled:opacity-50"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                disabled={isGenerating}
                aria-label="Due Date"
              />
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="md:col-span-1 flex items-center justify-center py-3 bg-amber-500 text-white font-bold rounded-xl shadow-md shadow-amber-500/30 hover:bg-amber-600 transition-all disabled:bg-gray-400"
              title="Send Invoice"
              aria-label="Send Invoice"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 shrink-0 flex justify-between items-center">
          <h4 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            <CreditCard className="text-amber-500" size={24} /> Financial Ledger
          </h4>
          <button
            onClick={() => setIsCompactView(!isCompactView)}
            aria-label="Toggle table density"
            title="Toggle Compact View"
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 shadow-sm transition-colors hidden sm:block"
          >
            {isCompactView ? <LayoutList size={18} /> : <List size={18} />}
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="p-6">
            <PremiumEmptyState
              icon={Receipt}
              title="No Invoices Found"
              description="There are currently no active or pending financial records for this account."
            />
          </div>
        ) : (
          <div className="overflow-auto max-h-[60vh] w-full relative">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
                <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className={`${isCompactView ? 'p-2.5' : 'p-4'} font-bold border-b border-gray-200 dark:border-gray-700 transition-all`}>Student</th>
                  <th className={`${isCompactView ? 'p-2.5' : 'p-4'} font-bold border-b border-gray-200 dark:border-gray-700 transition-all`}>Description</th>
                  <th className={`${isCompactView ? 'p-2.5' : 'p-4'} font-bold border-b border-gray-200 dark:border-gray-700 transition-all`}>Amount (₦)</th>
                  <th className={`${isCompactView ? 'p-2.5' : 'p-4'} font-bold border-b border-gray-200 dark:border-gray-700 transition-all`}>Due Date</th>
                  <th className={`${isCompactView ? 'p-2.5' : 'p-4'} font-bold text-center border-b border-gray-200 dark:border-gray-700 transition-all`}>Status</th>
                  {(isParent || isStudent) && (
                    <th className={`${isCompactView ? 'p-2.5' : 'p-4'} font-bold text-right pr-6 border-b border-gray-200 dark:border-gray-700 transition-all`}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {invoices.map((inv) => {
                  const isPaid = inv.status === "Paid";
                  return (
                    <tr key={inv.invoice_id} className="hover:bg-blue-50/30 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className={`${isCompactView ? 'p-2.5 text-sm' : 'p-4'} font-bold text-gray-900 dark:text-white transition-all`}>{inv.student_name}</td>
                      <td className={`${isCompactView ? 'p-2.5 text-sm' : 'p-4'} font-medium text-gray-600 dark:text-gray-300 transition-all`}>{inv.title}</td>
                      <td className={`${isCompactView ? 'p-2.5 text-sm' : 'p-4 text-[15px]'} font-mono font-bold text-gray-900 dark:text-white transition-all`}>
                        ₦{Number(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`${isCompactView ? 'p-2.5 text-xs' : 'p-4 text-sm'} font-mono font-medium text-gray-500 transition-all`}>
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className={`${isCompactView ? 'p-2.5' : 'p-4'} text-center transition-all`}>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black uppercase tracking-wider ${isCompactView ? 'text-[10px]' : 'text-xs'} ${isPaid ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500"}`}>
                          {isPaid ? <CheckCircle2 size={isCompactView ? 10 : 12} /> : <Clock size={isCompactView ? 10 : 12} />}
                          {inv.status}
                        </span>
                      </td>
                      {(isParent || isStudent) && (
                        <td className={`${isCompactView ? 'p-2.5' : 'p-4'} text-right transition-all`}>
                          {!isPaid ? (
                            <button
                              onClick={() => handlePayment(inv.invoice_id)}
                              disabled={isProcessing}
                              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2 ml-auto disabled:opacity-50 ${isCompactView ? 'px-3 py-1.5 text-xs' : 'px-5 py-2 text-sm'}`}
                            >
                              <CreditCard size={14} />{" "}
                              {isProcessing ? "..." : "Pay"}
                            </button>
                          ) : (
                            <span className={`text-green-600 dark:text-green-400 font-bold flex items-center justify-end gap-1 ${isCompactView ? 'text-xs' : 'text-sm'}`}>
                              <CheckCircle2 size={16} /> Settled
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceTab;