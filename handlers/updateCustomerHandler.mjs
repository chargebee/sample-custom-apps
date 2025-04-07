import axios from "axios";
import "dotenv/config";

export const handle = async (event) => {
  console.log("update customer handler invoked");
  const customer = getCustomer(event);
  console.log(`id: ${customer.id}, name: ${customer.name}`);
  if (customer === null) {
    console.log("Cannot update customer; customer is null");
    return;
  }
  return updateQBCustomer(customer.id, customer.name);
};

const updateQBCustomer = async (customerId, customerName) => {
  const accessToken = process.env.access_token;
  const url =
    "https://sandbox-quickbooks.api.intuit.com/v3/company/9341453851025983/customer?minorversion=40";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const data = {
    MiddleName: customerName,
    SyncToken: "1",
    Id: customerId,
    sparse: true,
  };

  try {
    return axios.post(url, data, { headers }).then((response) => {
      console.log("Success Response:", response.data);
      return response.data;
    });
  } catch (error) {
    console.log(`Error occurred ${error}`);
  }
};

const getCustomer = (event) => {
  console.log(`event ${event}`);
  const customer = event.content?.customer;
  console.log(`customer ${customer}`);
  const customerId = customer?.id || null;
  const firstName = customer?.first_name || null;
  if (firstName && customerId) {
    return {
      id: customerId,
      name: firstName,
    };
  }
  return null;
};
