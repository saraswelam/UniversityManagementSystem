import { useState, useEffect } from 'react';
import { payrollApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './PayrollPage.css';

function PayrollPage() {
  const [currentPayroll, setCurrentPayroll] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      const [current, history] = await Promise.all([
        payrollApi.getCurrent().catch(() => null),
        payrollApi.getAll(),
      ]);
      setCurrentPayroll(current);
      setPayrollHistory(history);
    } catch (error) {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  if (loading) return <div className="loading">Loading payroll information...</div>;

  return (
    <div className="payroll-page">
      <div className="page-header">
        <h2>My Payroll</h2>
      </div>

      {currentPayroll ? (
        <div className="current-payroll">
          <h3>Current Month - {formatMonth(currentPayroll.month)}</h3>
          <div className="payroll-summary">
            <div className="payroll-item">
              <label>Basic Salary</label>
              <div className="value">{formatCurrency(currentPayroll.basicSalary)}</div>
            </div>
            <div className="payroll-item">
              <label>Allowances</label>
              <div className="value">{formatCurrency(currentPayroll.allowances)}</div>
            </div>
            <div className="payroll-item">
              <label>Deductions</label>
              <div className="value">-{formatCurrency(currentPayroll.deductions)}</div>
            </div>
          </div>
          <div className="net-pay-section">
            <label>Net Pay</label>
            <div className="net-pay-amount">{formatCurrency(currentPayroll.netPay)}</div>
            <span className="payment-status">{currentPayroll.paymentStatus}</span>
          </div>
        </div>
      ) : (
        <div className="no-payroll">
          <p>No payroll information available for the current month.</p>
        </div>
      )}

      <div className="payroll-history">
        <h3>Payroll History</h3>
        {payrollHistory.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollHistory.map((payroll) => (
                <tr key={payroll._id}>
                  <td>{formatMonth(payroll.month)}</td>
                  <td>{formatCurrency(payroll.basicSalary)}</td>
                  <td>{formatCurrency(payroll.allowances)}</td>
                  <td>{formatCurrency(payroll.deductions)}</td>
                  <td className="amount">{formatCurrency(payroll.netPay)}</td>
                  <td>
                    <span className={`status-badge ${payroll.paymentStatus}`}>
                      {payroll.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-history">No payroll history available.</p>
        )}
      </div>
    </div>
  );
}

export default PayrollPage;
