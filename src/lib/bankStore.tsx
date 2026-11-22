import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface Account {
  id: string;
  name: string;
  masked: string;
  balance: number;
}

export interface Txn {
  id: string;
  title: string;
  subtitle: string;
  amount: number; // negative = debit
  when: string;
  category: "transfer" | "bill" | "load" | "fx" | "deposit" | "card";
}

const INITIAL_ACCOUNTS: Account[] = [
  { id: "savings", name: "Everyday Savings", masked: "****1176", balance: 520403.3 },
  { id: "plus", name: "YS Plus", masked: "****8842", balance: 87120.05 },
];

const INITIAL_TXNS: Txn[] = [
  {
    id: "t1",
    title: "Demo Grocery Mart",
    subtitle: "Card · ****8842",
    amount: -2145.5,
    when: "Today, 08:12",
    category: "card",
  },
  {
    id: "t2",
    title: "Salary — Fictional Corp",
    subtitle: "Credit · Everyday Savings",
    amount: 68500,
    when: "Yesterday",
    category: "deposit",
  },
  {
    id: "t3",
    title: "Demo Electric Co.",
    subtitle: "Bill payment",
    amount: -1250,
    when: "2 days ago",
    category: "bill",
  },
];

interface BankCtx {
  accounts: Account[];
  txns: Txn[];
  balanceOf: (id: string) => number;
  post: (args: {
    accountId?: string;
    title: string;
    subtitle: string;
    amount: number;
    category: Txn["category"];
  }) => void;
  reset: () => void;
}

const Ctx = createContext<BankCtx | null>(null);

export function BankProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [txns, setTxns] = useState<Txn[]>(INITIAL_TXNS);

  const post = useCallback<BankCtx["post"]>(({ accountId = "savings", title, subtitle, amount, category }) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, balance: Math.round((a.balance + amount) * 100) / 100 } : a)),
    );
    setTxns((prev) => [
      {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        subtitle,
        amount,
        when: "Just now",
        category,
      },
      ...prev,
    ]);
  }, []);

  const reset = useCallback(() => {
    setAccounts(INITIAL_ACCOUNTS);
    setTxns(INITIAL_TXNS);
  }, []);

  const balanceOf = useCallback(
    (id: string) => accounts.find((a) => a.id === id)?.balance ?? 0,
    [accounts],
  );

  const value = useMemo(
    () => ({ accounts, txns, balanceOf, post, reset }),
    [accounts, txns, balanceOf, post, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBank() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBank must be used inside BankProvider");
  return ctx;
}

export const php = (n: number) =>
  `PHP ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
