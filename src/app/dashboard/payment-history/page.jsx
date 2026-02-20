import { getTransactions } from "@/actions/transactionActions";
import React from "react";
import TransactionHistoryTable from "./TransactionHistoryTable";
import { MdOutlineReceiptLong } from "react-icons/md";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transaction History",
};

const page = async () => {
  const response = await getTransactions();

  if (response.status !== 200) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-[50%] text-center">
          <MdOutlineReceiptLong className="mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-4">No Transactions Found</h2>
          <p className="text-gray-700">
            There are no transaction records available at the moment.
          </p>
        </div>
      </div>
    );
  }

  const transactions = JSON.parse(response.transactions);

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-[50%] text-center">
          <MdOutlineReceiptLong className="mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-4">No Transactions Found</h2>
          <p className="text-gray-700">
            There are no transaction records available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      <TransactionHistoryTable transactions={transactions} />
    </div>
  );
};

export default page;
