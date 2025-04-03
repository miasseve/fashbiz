'use client';
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";

const formatTimestamp = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString(); // Convert Unix timestamp to readable format
};

const HistoryTable = ({ historyData }) => {
  if (!historyData || historyData.length === 0) {
    return <p>No transaction history available.</p>;
  }

  console.log(historyData, "historyData");
  return (
    <div className="overflow-x-auto">
      <Table isStriped >
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Currency</TableColumn>
          <TableColumn>Created</TableColumn>
          <TableColumn>Available On</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody>
          {historyData.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{transaction.id}</TableCell>
              <TableCell>{(transaction.amount / 100).toFixed(2)}</TableCell>
              <TableCell>{transaction.currency.toUpperCase()}</TableCell>
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
