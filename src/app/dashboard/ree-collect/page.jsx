import {
  getCollectProducts,
  getCollectStoreOrBrandNames,
} from "@/actions/productActions";
import CollectProduct from "./CollectProduct";
import { FaBoxOpen } from "react-icons/fa";
export const dynamic = 'force-dynamic';

export default async function CollectPage() {
  let products = [];
  let filterList = [];
  let role = "";
  try {
    const response = await getCollectProducts();
    products = (response.status === 200) ? JSON.parse(response.products) : [];
    const { FilterList, userRole} = await getCollectStoreOrBrandNames();
    filterList = FilterList;
    role = userRole;
  } catch (error) {
    console.error("Error fetching collect products:", error);
    products = [];
    filterList = [];
  }

  if (products.length == 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-[50%] text-center">
          <FaBoxOpen className="mx-auto mb-4 text-pink-600" size={48} />
          <h2 className="text-2xl font-bold mb-4">
            No Ree Collect Products Found
          </h2>
          <p className="text-gray-700">
            Please add Ree Collect products to view them here
          </p>
        </div>
      </div>
    );
  }

  return <CollectProduct products={products} filters={filterList} userRole={role} />;
}
