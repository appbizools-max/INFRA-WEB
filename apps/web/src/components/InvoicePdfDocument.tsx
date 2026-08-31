import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Premium Executive Styles for @react-pdf/renderer Invoice
const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  topBanner: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
    borderRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBannerText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0f172a',
    paddingBottom: 10,
    marginBottom: 10,
  },
  companyBox: {
    flexDirection: 'column',
    maxWidth: '65%',
  },
  companyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  isoBadge: {
    backgroundColor: '#fef3c7',
    color: '#78350f',
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: '#f59e0b',
  },
  companySubtitle: {
    fontSize: 7.5,
    color: '#475569',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  taxRegText: {
    fontSize: 7.5,
    color: '#334155',
    fontFamily: 'Helvetica',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 7,
    color: '#64748b',
  },
  docMetaBox: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  docTypeBadge: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  metaVal: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 7.5,
    color: '#475569',
    marginBottom: 1,
  },
  irnBanner: {
    backgroundColor: '#f8fafc',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  irnText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  partyCard: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 8,
  },
  cardTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textTransform: 'uppercase',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 3,
  },
  cardText: {
    fontSize: 7.5,
    color: '#475569',
    marginBottom: 2,
  },
  boldVal: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#0f172a',
    borderRadius: 3,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    padding: 5,
    alignItems: 'center',
  },
  colNo: { width: '5%', textAlign: 'center', fontSize: 7.5 },
  colDesc: { width: '43%' },
  colHsn: { width: '10%', textAlign: 'center', fontSize: 7.5 },
  colCode: { width: '14%', textAlign: 'center', fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  colDebit: { width: '14%', textAlign: 'right', fontSize: 7.5 },
  colCredit: { width: '14%', textAlign: 'right', fontSize: 7.5 },
  itemDesc: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  itemScope: { fontSize: 6.5, color: '#64748b', marginTop: 1 },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bankBox: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 8,
  },
  totalBox: {
    width: '48.5%',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: 4,
    padding: 8,
    justifyContent: 'space-between',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#fbbf24',
  },
  grandTotalVal: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  wordsText: {
    fontSize: 7.5,
    color: '#fef08a',
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#334155',
    paddingTop: 3,
  },
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    paddingTop: 10,
  },
  termsBox: {
    width: '40%',
  },
  signatureBox: {
    width: '28%',
    alignItems: 'center',
  },
  sealBox: {
    width: '28%',
    borderWidth: 1,
    borderColor: '#1e3a8a',
    borderRadius: 4,
    backgroundColor: '#eff6ff',
    padding: 6,
    alignItems: 'center',
  },
  sealTitle: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
  },
  sealCompany: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    marginVertical: 2,
    textAlign: 'center',
  },
  sealStatus: {
    fontSize: 6,
    color: '#1d4ed8',
    fontFamily: 'Helvetica-Bold',
  },
});

interface InvoicePdfProps {
  tx: any;
  ledger: any;
  linkedAdjustments: any[];
  grandTotal: number;
  amountInWords: string;
}

export const InvoicePdfDocument: React.FC<InvoicePdfProps> = ({
  tx,
  ledger,
  linkedAdjustments,
  grandTotal,
  amountInWords,
}) => {
  const isIncome = Number(tx?.credit_amount || 0) > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Banner */}
        <View style={styles.topBanner}>
          <Text style={styles.topBannerText}>OFFICIAL GOVERNMENT E-INVOICE &amp; FINANCIAL VOUCHER</Text>
          <Text style={styles.topBannerText}>INFRAOPS360 CONSTRUCTIONS</Text>
        </View>

        {/* Company & Document Header */}
        <View style={styles.headerRow}>
          <View style={styles.companyBox}>
            <View style={styles.companyTitleRow}>
              <Text style={styles.companyName}>INFRAOPS360 CONSTRUCTIONS PVT LTD</Text>
              <Text style={styles.isoBadge}>ISO 9001:2015</Text>
            </View>
            <Text style={styles.companySubtitle}>
              Civil Infrastructure Engineering, Building Contractors &amp; Heavy Site Operations
            </Text>
            <Text style={styles.taxRegText}>
              GSTIN: 36AAACI1234F1Z9 | PAN: AAACI1234F | CIN: U45200TG2020PTC123456
            </Text>
            <Text style={styles.addressText}>
              Corporate HQ: Plot #102, Tech Park Highway, Hitec City, Hyderabad, Telangana - 500081
            </Text>
          </View>

          <View style={styles.docMetaBox}>
            <Text style={styles.docTypeBadge}>
              {isIncome ? 'TAX INVOICE / RECEIPT' : 'OFFICIAL PAYMENT VOUCHER'}
            </Text>
            <Text style={styles.metaVal}>Voucher Ref: {tx?.voucherNo || tx?.voucher_no || 'QT-1001'}</Text>
            <Text style={styles.metaLabel}>
              Posting Date: {new Date(tx?.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
            <Text style={styles.metaLabel}>State Code: Telangana (36)</Text>
          </View>
        </View>

        {/* e-Invoice IRN Hash Banner */}
        <View style={styles.irnBanner}>
          <Text style={styles.irnText}>IRN: a9f4e2b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8</Text>
          <Text style={styles.irnText}>Ack No: 122610987654</Text>
        </View>

        {/* Party & Worksite Cards Grid */}
        <View style={styles.grid}>
          <View style={styles.partyCard}>
            <Text style={styles.cardTitle}>Billed To / Party Ledger Account</Text>
            <Text style={styles.partyName}>{ledger?.name || tx?.ledger_code}</Text>
            <Text style={styles.cardText}>Ledger Code: <Text style={styles.boldVal}>{tx?.ledger_code}</Text></Text>
            <Text style={styles.cardText}>Group: <Text style={styles.boldVal}>{ledger?.group || 'Vendor Account'}</Text></Text>
            <Text style={styles.cardText}>Party GSTIN: <Text style={styles.boldVal}>36ABCDE1234F1Z5</Text></Text>
          </View>

          <View style={styles.partyCard}>
            <Text style={styles.cardTitle}>Worksite Location &amp; Project Scope</Text>
            <Text style={styles.partyName}>{tx?.projName || 'General Project Scope'}</Text>
            <Text style={styles.cardText}>Worksite: <Text style={styles.boldVal}>{tx?.site_id || 'Head Office Main Site'}</Text></Text>
            <Text style={styles.cardText}>Payment Mode: <Text style={styles.boldVal}>Electronic Transfer (NEFT/RTGS)</Text></Text>
            <Text style={styles.cardText}>Audit Status: <Text style={styles.boldVal}>POSTED &amp; AUDITED</Text></Text>
          </View>
        </View>

        {/* Financial Particulars Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>#</Text>
            <Text style={styles.colDesc}>Item / Description Particulars</Text>
            <Text style={styles.colHsn}>HSN/SAC</Text>
            <Text style={styles.colCode}>Ledger</Text>
            <Text style={styles.colDebit}>Debit (₹)</Text>
            <Text style={styles.colCredit}>Credit (₹)</Text>
          </View>

          {/* Primary Line Item */}
          <View style={styles.tableRow}>
            <Text style={styles.colNo}>01</Text>
            <View style={styles.colDesc}>
              <Text style={styles.itemDesc}>{tx?.description || tx?.note || 'Ledger Entry Transaction'}</Text>
              <Text style={styles.itemScope}>Project Scope: {tx?.projName || 'General Overhead'}</Text>
            </View>
            <Text style={styles.colHsn}>995411</Text>
            <Text style={styles.colCode}>{tx?.ledger_code}</Text>
            <Text style={styles.colDebit}>₹{Number(tx?.debit_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.colCredit}>₹{Number(tx?.credit_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>

          {/* Linked Adjustments (Debit/Credit Notes) */}
          {linkedAdjustments.map((adj: any, aIdx: number) => {
            const adjDebit = Number(adj.debit_amount || 0);
            const adjCredit = Number(adj.credit_amount || 0);
            return (
              <View key={adj.id || aIdx} style={[styles.tableRow, { backgroundColor: '#fffbeb' }]}>
                <Text style={styles.colNo}>0{aIdx + 2}</Text>
                <View style={styles.colDesc}>
                  <Text style={[styles.itemDesc, { color: '#78350f' }]}>📜 {adj.description}</Text>
                  <Text style={styles.itemScope}>Ref Voucher #: {adj.voucher_no || `ADJ-${aIdx}`}</Text>
                </View>
                <Text style={styles.colHsn}>995411</Text>
                <Text style={styles.colCode}>{adj.ledger_code || tx?.ledger_code}</Text>
                <Text style={[styles.colDebit, { color: '#991b1b', fontFamily: 'Helvetica-Bold' }]}>
                  ₹{adjDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.colCredit, { color: '#065f46', fontFamily: 'Helvetica-Bold' }]}>
                  ₹{adjCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Summary & Bank Account Grid */}
        <View style={styles.summaryGrid}>
          <View style={styles.bankBox}>
            <Text style={styles.cardTitle}>Official Bank Remittance Details</Text>
            <Text style={styles.cardText}>Bank Name: <Text style={styles.boldVal}>HDFC Bank Ltd.</Text></Text>
            <Text style={styles.cardText}>Account Name: <Text style={styles.boldVal}>INFRAOPS360 CONSTRUCTIONS PVT LTD</Text></Text>
            <Text style={styles.cardText}>Account Number: <Text style={styles.boldVal}>50200012345678</Text></Text>
            <Text style={styles.cardText}>IFSC Code: <Text style={styles.boldVal}>HDFC0001234</Text> (Hitec City Branch)</Text>
          </View>

          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 7.5, color: '#94a3b8' }}>Sub-Total Base Amount:</Text>
              <Text style={{ fontSize: 8.5, color: '#ffffff', fontFamily: 'Helvetica-Bold' }}>
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>GRAND TOTAL:</Text>
              <Text style={styles.grandTotalVal}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            </View>
            <Text style={styles.wordsText}>Amount in Words: {amountInWords}</Text>
          </View>
        </View>

        {/* Footer Terms & Signatures / Stamp */}
        <View style={styles.footerGrid}>
          <View style={styles.termsBox}>
            <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#334155', marginBottom: 2 }}>
              COMMERCIAL TERMS &amp; DECLARATIONS
            </Text>
            <Text style={{ fontSize: 5.5, color: '#64748b' }}>
              1. All entries subject to internal financial audit verification.
            </Text>
            <Text style={{ fontSize: 5.5, color: '#64748b' }}>
              2. Issued under Section 31 of CGST Act 2017.
            </Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={{ width: 90, borderBottomWidth: 1, borderBottomColor: '#64748b', marginBottom: 3 }} />
            <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#334155' }}>
              ACCOUNTANT SIGNATURE
            </Text>
          </View>

          <View style={styles.sealBox}>
            <Text style={styles.sealTitle}>OFFICIAL CORPORATE SEAL</Text>
            <Text style={styles.sealCompany}>INFRAOPS360 CONSTRUCTIONS</Text>
            <Text style={styles.sealStatus}>AUDITED &amp; APPROVED</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};


