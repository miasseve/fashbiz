import { getTransactionsForConnectedAccount } from '@/actions/accountAction'
import React from 'react'
import HistoryTable from './HistoryTable';
export const dynamic = "force-dynamic";
const page = async() => {
   const response =  await getTransactionsForConnectedAccount();
   if(response.status!=200)
   {
      <div>
      <p>No Transactions found</p>
      </div>  
   }
   return (
    <div>
       <HistoryTable historyData={response.transactions}/>
    </div>
  )
}

export default page