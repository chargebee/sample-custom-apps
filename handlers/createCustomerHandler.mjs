import axios from "axios";
import "dotenv/config";

export const handle = async (event, domain) => {
  console.log(`event message : ${JSON.stringify(event)}`);
  console.log("qb create customer handler invoked");
  const customer = getCustomer(event);
  if (customer === null) {
    console.log("Cannot create customer; customer is null");
    return;
  }
  return createQBCustomer(customer);
};

const createQBCustomer = (customer) => {
  const accessToken = process.env.access_token;
  const url =
    "https://sandbox-quickbooks.api.intuit.com/v3/company/9341453851025983/customer?minorversion=73";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const data = {
    DisplayName: customer.first_name,
    CompanyName: customer.company,
    PrimaryEmailAddr: {
      Address: customer.email,
    },
    Mobile: {
      FreeFormNumber: customer.phone,
    },
    BillAddr: {
      Line1: customer.billing_address.line1,
      Line2: customer.billing_address.line2,
      City: customer.billing_address.city,
      PostalCode: customer.zip,
    },
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
  console.log(`customer ${JSON.stringify(customer)}`);
  return customer;
};
