import { getTransactionsForConnectedAccount } from '@/actions/accountAction'
import React from 'react'
import HistoryTable from './HistoryTable';

const page = async() => {
   const res =  await getTransactionsForConnectedAccount();
  console.log(res,'ress');
  
   return (
    <div>
       <HistoryTable historyData={res}/>
    </div>
  )
}

export default page