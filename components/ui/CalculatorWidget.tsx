"use client";

import { useState } from "react";

export default function CalculatorWidget() {
  const [open, setOpen] = useState(false);
  const [expr, setExpr] = useState("0");
  const [vat, setVat] = useState(18);

  function press(key: string) {
    setExpr((s) => {
      if (s === "0") return key;
      return s + key;
    });
  }

  function clear() {
    setExpr("0");
  }

  function del() {
    setExpr((s) => (s.length <= 1 ? "0" : s.slice(0, -1)));
  }

  function evaluate() {
    try {
      // eslint-disable-next-line no-eval
      const v = eval(expr || "0");
      setExpr(String(Number.isFinite(v) ? v : 0));
    } catch {
      setExpr("0");
    }
  }

  const numeric = Number(expr) || 0;
  const vatAmount = +(numeric * (vat / 100)).toFixed(2);
  const total = +(numeric + vatAmount).toFixed(2);

  return (
    <div>
      <button
        aria-label="Calculator"
        onClick={() => {
          setOpen((o) => !o);
          // when opening, attempt to pre-fill from paymentAmount input if present
          if (!open) {
            try {
              const el = document.getElementById("paymentAmount") as HTMLInputElement | null;
              if (el && el.value) setExpr(el.value);
            } catch {}
          }
        }}
        className="calculator-fab"
        title="Calculator"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7h10M7 11h10M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="calculator-panel">
          <div className="calculator-header">
            <div className="text-sm font-medium">Calculator</div>
            <div className="text-xs text-muted-foreground">VAT {vat}%</div>
          </div>

          <div className="calculator-display">
            <input
              className="w-full bg-transparent text-right text-lg font-medium outline-none"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
            />
            <div className="text-sm text-muted-foreground mt-1">
              VAT: {vatAmount} • Total: {total}
            </div>
          </div>

          <div className="calculator-controls">
            <div className="grid grid-cols-4 gap-2">
              {[
                "7",
                "8",
                "9",
                "/",
                "4",
                "5",
                "6",
                "*",
                "1",
                "2",
                "3",
                "-",
                ".",
                "0",
                "=",
                "+",
              ].map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    if (k === "=") return evaluate();
                    press(k);
                  }}
                  className="px-3 py-2 rounded bg-muted/10 hover:bg-muted/20"
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input
                type="number"
                min={0}
                className="h-9 w-20 rounded border px-2"
                value={vat}
                onChange={(e) => setVat(Number(e.target.value))}
              />
              <button onClick={clear} className="px-3 py-2 rounded bg-red-500 text-white">C</button>
              <button onClick={del} className="px-3 py-2 rounded bg-yellow-400">DEL</button>
              <button
                onClick={() => {
                  // dispatch global event so forms can pick up the value
                  try {
                    const ev = new CustomEvent("calculator-use-total", {
                      detail: { total },
                    });
                    window.dispatchEvent(ev);
                  } catch (e) {
                    // fallback: directly set any paymentAmount input in DOM
                    const el = document.getElementById("paymentAmount") as HTMLInputElement | null;
                    if (el) {
                      el.value = String(total);
                      el.dispatchEvent(new Event("input", { bubbles: true }));
                      el.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                  }
                }}
                className="ml-auto px-3 py-2 rounded bg-primary text-white"
              >
                Use Total
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
