import { getTransactionsForConnectedAccount } from '@/actions/accountAction'
import React from 'react'
import HistoryTable from './HistoryTable';
export const dynamic = "force-dynamic";
const page = async() => {
   const res =  await getTransactionsForConnectedAccount();
  
   return (
    <div>
       <HistoryTable historyData={res}/>
    </div>
  )
}

export default page