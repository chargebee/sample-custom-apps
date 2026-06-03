/**
 * Serverless function handlers
 * Each handler receives a single payload argument with payload.event and payload.iparams
 */
module.exports = {

  /**
   * Handles invoice_generated events
   * @param {import('../types/types.d.ts').HandlerPayload} payload - Event and iparams
   */
  invoiceGeneratedHandler: function(/** @type {import('../types/types.d.ts').HandlerPayload} */payload) {
    const invoice = payload.event.content.invoice;

    // Need feedback on this
    // ------------------------------------------------------------------------------------------------
    // Here is one way of using the iparams where we are directly accessing the parameters without sections.
    // In the iparams.json file, we have defined the parameters inside a section called 
    // "processing_fee_configuration" and "late_payment_fee_configuration".
    // but we are directly accessing the parameters without sections.

    // instead of using payload.iparams.processing_fee_configuration.processing_fee_percentage,
    //  we are using payload.iparams.processing_fee_percentage.

    // one limitation of this approach is that we can't have duplicate names accross sections.
    // ------------------------------------------------------------------------------------------------

    const processingFeePercentage = Number(payload.iparams.processing_fee_percentage);
    const processingFeeLimit = Number(payload.iparams.processing_fee_limit);
    const latePaymentFeePercentage = Number(payload.iparams.late_payment_fee_percentage);

    const isUnpaid = invoice.status !== 'paid';
    const hasChargeableTotal = invoice.total > 0;
    const isPastDue = invoice.due_date < payload.event.occurred_at;

    if (isUnpaid && hasChargeableTotal) {
      const calculatedProcessingFee = calculateAdditionalFee(invoice.total, processingFeePercentage);
      const processingFee = Math.min(calculatedProcessingFee, processingFeeLimit);
      applyAdditionalFee(invoice, processingFee);
    }

    if (isUnpaid && isPastDue && hasChargeableTotal) {
      const latePaymentFee = calculateAdditionalFee(invoice.total, latePaymentFeePercentage);
      applyAdditionalFee(invoice, latePaymentFee);
    }
  }

};

/**
 * @param {Record<string, unknown>} invoice - Invoice object from the event payload
 * @param {number} additionalFee - Fee amount to charge on the invoice
 */
function applyAdditionalFee(invoice, additionalFee) {
  // The code for applying the additional fee goes here
}

/**
 * @param {number} invoiceTotal - Invoice total in minor currency units (e.g. cents)
 * @param {number} feePercentage - Fee percentage from installation parameters
 * @returns {number}
 */
function calculateAdditionalFee(invoiceTotal, feePercentage) {
  return (invoiceTotal * feePercentage) / 100;
}
