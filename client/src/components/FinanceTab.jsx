import React, { useState, useEffect } from "react";

const FinanceTab = ({ isAdmin, isParent, isStudent, students }) => {
  const [invoices, setInvoices] = useState([]);
  const [formData, setFormData] = useState({
    student_id: "",
    title: "",
    amount: "",
    due_date: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/finance/invoices", {
        headers: { jwt_token: token },
      });
      if (res.ok) setInvoices(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const onCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/finance/invoices", {
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
    }
  };

  const handlePayment = async (invoice_id) => {
    // Simulate opening a payment gateway (like Paystack)
    if (
      !window.confirm("Proceed to secure payment gateway to pay this invoice?")
    )
      return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/finance/invoices/${invoice_id}/pay`,
        {
          method: "PUT",
          headers: { jwt_token: token },
        },
      );
      if (res.ok) {
        alert("🎉 Payment Successful! Receipt emailed.");
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Admin Invoice Generator */}
      {isAdmin && (
        <form
          onSubmit={onCreateInvoice}
          className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl shadow-md border border-amber-200 dark:border-amber-700 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1">
            <select
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              value={formData.student_id}
              onChange={(e) =>
                setFormData({ ...formData, student_id: e.target.value })
              }
              required
            >
              <option value="">-- Select Student --</option>
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.full_name} ({s.class_grade})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Description (e.g., Term 1 Tuition)"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>
          <div className="w-32">
            <input
              type="number"
              placeholder="Amount (₦)"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
              min="1"
            />
          </div>
          <div className="w-40">
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700"
          >
            Issue Bill
          </button>
        </form>
      )}

      {/* Invoices List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
        <h4 className="text-xl font-bold mb-4 dark:text-white">
          💳 Financial Records
        </h4>
        {invoices.length === 0 ? (
          <p className="text-gray-500 italic">No invoices found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <th className="p-3 border-b">Student</th>
                  <th className="p-3 border-b">Description</th>
                  <th className="p-3 border-b">Amount</th>
                  <th className="p-3 border-b">Due Date</th>
                  <th className="p-3 border-b text-center">Status</th>
                  {(isParent || isStudent) && (
                    <th className="p-3 border-b text-center">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.invoice_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="p-3 border-b font-semibold">
                      {inv.student_name}
                    </td>
                    <td className="p-3 border-b">{inv.title}</td>
                    <td className="p-3 border-b font-bold">
                      ₦{Number(inv.amount).toLocaleString()}
                    </td>
                    <td className="p-3 border-b text-sm text-gray-500">
                      {new Date(inv.due_date).toLocaleDateString()}
                    </td>
                    <td className="p-3 border-b text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${inv.status === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    {(isParent || isStudent) && (
                      <td className="p-3 border-b text-center">
                        {inv.status === "Pending" ? (
                          <button
                            onClick={() => handlePayment(inv.invoice_id)}
                            disabled={isProcessing}
                            className="px-4 py-1 bg-green-600 text-white font-bold rounded hover:bg-green-700"
                          >
                            {isProcessing ? "Processing..." : "Pay Now"}
                          </button>
                        ) : (
                          <span className="text-green-600 font-bold">
                            ✓ Settled
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceTab;
