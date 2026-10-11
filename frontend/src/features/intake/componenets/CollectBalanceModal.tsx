"use client";

import { useState } from "react";
import { CreditCard, Wallet, X, IndianRupee, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { toast } from "@/lib/toast";
import { intakeService, PaymentMethodEnum } from "../api/intake.service";
import type { IntakeRecord } from "../schemas/intake.schema";

interface CollectBalanceModalProps {
  record: IntakeRecord;
  onClose: () => void;
  onSuccess?: () => void;
}

const formatApiError = (error: any): string => {
  if (!error.isAxiosError) return error instanceof Error ? error.message : "Unexpected error.";
  if (!error.response) return "Network error. Please check your connection.";
  const detail = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((err) => `${err.loc?.[err.loc.length - 1] || 'Field'}: ${err.msg}`).join(" | ");
  return error.message || "A system error occurred.";
};

const CURRENCY = (num?: number) => (Number(num) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export function CollectBalanceModal({ record, onClose, onSuccess }: CollectBalanceModalProps) {
  const balanceDue = record.balance_due || 0;

  const [amount, setAmount] = useState<number | "">(balanceDue);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      toast.warning("Invalid Amount", "Please enter a valid payment amount.");
      return;
    }

    if (numAmount > balanceDue) {
      toast.warning("Overpayment Error", `Maximum remaining balance is ₹${CURRENCY(balanceDue)}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 🚀 Payload matching your backend update route handling additional_payment
      toast.success("Feature is not active yet.", `For more write to Team.`);
    //   const payload = {
    //     additional_payment: numAmount,
    //     payment_method: paymentMethod,
    //   };

    //   await intakeService.updateIntake(record.id, payload);
      
    //   toast.success("Balance Collected", `₹${CURRENCY(numAmount)} successfully recorded for ${record.patient_name}.`);
      
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Collection Failed", formatApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/20">
              <Wallet size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Collect Pending Balance</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {record.accession_number} • {record.patient_name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Balance Due Summary Card */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">Total Balance Due</span>
              <span className="text-xl font-black font-mono text-amber-900">₹{CURRENCY(balanceDue)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 block">Total Net Amount</span>
              <span className="text-sm font-bold font-mono text-slate-700">₹{CURRENCY(record.net_amount)}</span>
            </div>
          </div>

          {/* Amount Input */}
          <Input 
            label="Payment Amount (₹)"
            type="number"
            required
            min="1"
            max={balanceDue}
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
            placeholder="Enter amount to collect..."
            icon={IndianRupee}
          />

          {/* Payment Method Selector */}
          <Select 
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodEnum)}
            options={[
              { label: "UPI (Google Pay, PhonePe, Paytm)", value: "UPI" },
              { label: "Cash", value: "Cash" },
              { label: "Credit / Debit Card", value: "Card" },
              { label: "Net Banking", value: "Net_Banking" }
            ]}
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!amount || Number(amount) <= 0 || isSubmitting}
              isLoading={isSubmitting}
              icon={<CheckCircle2 size={18} strokeWidth={2.5} />}
            >
              Confirm & Collect
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}