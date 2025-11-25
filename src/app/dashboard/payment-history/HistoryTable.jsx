"use client";
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { TbHistoryToggle } from "react-icons/tb";

const formatTimestamp = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString();
};

const HistoryTable = ({ historyData }) => {
  if (!historyData || historyData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-[50%] text-center">
          <TbHistoryToggle className="mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-4">No Transactions found</h2>
          <p className="text-gray-700">
            There are no payment transactions available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto ">
      <Table isStriped>
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Currency</TableColumn>
          <TableColumn>Type</TableColumn>
          <TableColumn>Created</TableColumn>
          <TableColumn>Available On</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody>
          {historyData.map((transaction) => (
            <TableRow
              key={transaction.id}
              className={transaction.type === "payout" ? "bg-yellow-100" : ""}
            >
              <TableCell>{transaction.id}</TableCell>
              <TableCell>{(transaction.amount / 100).toFixed(2)}</TableCell>
              <TableCell>{transaction.currency.toUpperCase()}</TableCell>
              <TableCell>{transaction.type}</TableCell>
              <TableCell>{formatTimestamp(transaction.created)}</TableCell>
              <TableCell>{formatTimestamp(transaction.available_on)}</TableCell>
              <TableCell>{transaction.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HistoryTable;
