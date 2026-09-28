import * as React from 'react';
import './App.css'
import Button from '@mui/material/Button';
import { ReactComponent as Visa } from './assets/visa.svg';
import { ReactComponent as Discover } from './assets/discover.svg';
import { ReactComponent as Express } from './assets/express.svg';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ErrorMessage } from './components/ErrorMessage';
import currencies from './constants/currencies';
import countriesCurrency from './constants/countries-currency';
import { getUnique } from './utils';
import { City, State } from 'country-state-city';
import { TurnstileWidget } from './components/TurnstileWidget';

const months = [
  '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
]

function createArray(start, end) {
  let array = [];
  for (let i = start; i <= end; i++) {
    array.push(i);
  }
  return array;
}

const years = createArray(2024, 2999)

const uniqueCurrencies = getUnique(currencies)

const formatNumber = (num) => {
  if (typeof num !== 'string') return ""; // Ensure num is a string
  // Remove commas before formatting
  const cleanNum = num.replace(/,/g, "");
  // Add commas for every three digits
  return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getNumericValue = (formattedValue) => {
  if (typeof formattedValue === 'string') {
    return formattedValue.replace(/,/g, "");
  }
  console.warn('Invalid input for getNumericValue:', formattedValue);
  return "0";
};

const removeLeadingZeros = (num) => {
  if (num === '') return ''
  return num.replace(/^0+(?!\.)/, "") || "0";
};

export default function App() {
  const [invoice, setInvoice] = React.useState('')
  const [total, setTotal] = React.useState()
  const [cf_Physician, setCfPhysician] = React.useState('')
  const [cf_Non_listed_Physician, setCFNonListedPhysician] = React.useState('')
  const [routingNumber, setRoutingNumber] = React.useState('')
  const [accountNumber, setAccountNumber] = React.useState('')
  const [CreditCardNumber, setCreditCardNumber] = React.useState('')
  const [expirationDateMonth, setExpirationDateMonth] = React.useState('')
  const [expirationDateYear, setExpirationDateYear] = React.useState('')
  const [CreditCardCVV, setCreditCardCVV] = React.useState('')
  const [billCompany, setBillCompany] = React.useState('')
  const [billAddress1, setBillAddress1] = React.useState('')
  const [billAddress2, setBillAddress2] = React.useState('')
  const [billFName, setBillFName] = React.useState('')
  const [billLName, setBillLName] = React.useState('')
  const [billCity, setBillCity] = React.useState('')
  const [billState, setBillState] = React.useState('')
  const [billCountry, setBillCountry] = React.useState('US')
  const [billZip, setBillZip] = React.useState('')
  const [currency, setCurrency] = React.useState('USD')
  const [email, setEmail] = React.useState('')
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [state, setState] = React.useState(false)
  const [errors, setErrors] = React.useState(null)
  const [turnstileToken, setTurnstileToken] = React.useState('')

  const states = React.useMemo(() => {
    return State.getStatesOfCountry(billCountry) ?? []
  }, [billCountry])

  // const cities = React.useMemo(() => {
  //   if (billState && billState !== '') {
  //     return City.getCitiesOfState(billCountry, billState)
  //   } else {
  //     return []
  //   }
  // }, [billCountry, billState])

  const generateEmail = async (formData) => {
    try {
      const response = await fetch('/src/PaymentConfirmation.html')
      const template = await response.text()
      let emailContent = template

      // Replace placeholders with actual data
      Object.keys(formData).forEach(key => {
        emailContent = emailContent.replace(new RegExp(`{{${key}}}`, 'g'), formData[key])
      })

      return emailContent
    } catch (error) {
      console.error('Error fetching email template:', error)
      toast.error('Failed to generate email content')
      return ''
    }
  }
  const sendEmail = (emailContent) => {
    fetch('/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Payment Confirmation',
        html: emailContent,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          toast.success('Email sent successfully!')
        } else {
          toast.error('Failed to send email.')
        }
      })
      .catch(error => {
        toast.error('An error occurred while sending the email.')
        console.error('Error:', error)
      })
  }
  const symbol = React.useMemo(() => {
    const item = currencies.find(({ currency: _currency }) => _currency === currency)
    if (item) return item.symbol
    else return '$'
  }, [currency])

  const getToken = async () => {
    const url = '/api/tokens';
    const headers = {
      'Content-Type': 'application/json',
    };

    const _errors = {}
    let __error = false
    if (!CreditCardNumber || CreditCardNumber === '') {
      _errors.card_number = 'The card number field is required.'
      __error = true
    }
    if (!expirationDateMonth || expirationDateMonth === '') {
      _errors.exp_month = 'The expiration date month field is required.'
      __error = true
    }
    if (!expirationDateYear || expirationDateYear === '') {
      _errors.exp_year = 'The expiration date year is required.'
      __error = true
    }

    if (!CreditCardCVV || CreditCardCVV === '') {
      _errors.CCV2 = 'The CCV field is required.'
      __error = true
    }

    if (!billFName || billFName === '') {
      _errors.billFName = 'The first name field is required.'
      __error = true
    }

    if (!billLName || billLName === '') {
      _errors.billLName = 'The last name field is required.'
      __error = true
    }

    if (!email || email === '') {
      _errors.email = 'The email field is required.';
      __error = true;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      _errors.email = 'Please enter a valid email address.';
      __error = true;
    }

    if (!phoneNumber || phoneNumber === '') {
      _errors.phone_number = 'The phone number field is required.';
      __error = true;
    } else if (!/^[0-9]{2,11}$/.test(phoneNumber)) {
      _errors.phone_number = 'Please enter a valid phone number with 2 to 11 digits.';
      __error = true;
    }

    if (!billAddress1 || billAddress1 === '') {
      _errors.billAddress1 = 'The address 1 field is required.'
      __error = true
    }

    if (!billCity || billCity === '') {
      _errors.billCity = 'The city field is required.'
      __error = true
    }

    if (!billCountry || billCountry === '') {
      _errors.billCountry = 'The card number field is required.'
      __error = true
    }

    if (!billState || billState === '') {
      _errors.billState = 'The state field is required.'
      __error = true
    }


    if (!billZip || billZip === '') {
      _errors.billZip = 'The zip field is required.'
      __error = true
    }

    if (!invoice || invoice === '') {
      _errors.invoice = 'The invoice field is required.';
      __error = true;
    } else if (/[-\s]/.test(invoice)) {
      _errors.invoice = 'Please enter your invoice number without spaces or a dash.';
      __error = true;
    }

    if (__error) {
      setErrors(_errors)
      return
    }


    const metadata = {
      invoice_id: invoice,
      'physician_name': (cf_Physician && cf_Physician !== '' && cf_Physician !== 'Physician_not_listed') ? cf_Physician : cf_Non_listed_Physician ?? ''
    }
    const payload = {
      'card_source': 'INTERNET',
      'card_number': CreditCardNumber,
      'exp_month': expirationDateMonth,
      'exp_year': expirationDateYear,
      'cvv': CreditCardCVV,
      'card_holder_name': `${billFName} ${billLName}`,
      'address_line1': billAddress1,
      'address_line2': (billAddress2 && billAddress2 !== '') ? billAddress2 : undefined,
      'city': billCity,
      'phone_number': phoneNumber,
      'email': email,
      'state': billState,
      'country': billCountry,
      'zip': Number(billZip),
      metadata: JSON.stringify(metadata),
      turnstileToken
    };


    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    if (responseData.message) {
      toast.error(responseData.message)
    }
    if (responseData.errors) {
      setErrors(responseData.errors)
      return null
    } else {
      return responseData?.data?.id ?? null;
    }
  }

  const makeCharge = async (tokenId) => {
    const descriptor = 'ARTREPCN';
    const url = '/api/charges';
    const headers = {
      'Content-Type': 'application/json',
    };
    const physician_name = (cf_Physician && cf_Physician !== '' && cf_Physician !== 'Physician_not_listed') ? cf_Physician : cf_Non_listed_Physician ?? ''

    const _errors = {}
    let __error = false
    if (Number(getNumericValue(total)) < 0.01) {
      _errors.amount = 'A amount must be at least 1 cent(s)'
      __error = true
    }
    if (physician_name === '') {
      _errors.physician_name = 'You must select physician name.'
      __error = true
    }
    if (currency === '') {
      _errors.currency = 'You must select currency.'
      __error = true
    }

    if (__error) {
      setErrors(_errors)
      return
    }

    const metadata = {
      invoice_id: invoice,
      physician_name
    }

    const purchase_order = invoice;
    //const customer_ref_id = physician_name.replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '').toUpperCase()
    const supplier_reference_number = (invoice.slice(-9)).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const customer_ref_id = (invoice.slice(-16)).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    const payload = {
      'amount': Number(getNumericValue(total)) * 100,
      'currency': currency.toLowerCase(),
      'statement_description': descriptor,
      'token_id': tokenId,
      'capture': '1',
      'sales_tax': '0',
      'card_level': 'LEVEL2',
      'ship_to_zip': Number(billZip),
      'amex_descriptor': descriptor,
      'supplier_reference_number': supplier_reference_number,
      'phone_number': phoneNumber,
      'email': email,
      purchase_order,
      customer_ref_id,
      metadata: JSON.stringify(metadata),
      turnstileToken
    };

    const formBody = JSOn.stringify(payload)

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formBody
    });

    const responseData = await response.json();
    if (responseData.message) {
      toast.error(responseData.message)
    }
    if (responseData.errors) {
      setErrors(responseData.errors)
      return null
    }
    return responseData;
  }

  const submit = async () => {
    try {
      setState(true)
      setErrors(null)
      const token = await getToken()
      if (token) {
        const result = await makeCharge(token)
        if (result?.data) {
          // const formData = {
          //   invoice,
          //   total,
          //   physician: cf_Physician || cf_Non_listed_Physician,
          //   paymentMethod: routingNumber ? 'Bank Transfer' : 'Credit Card',
          //   CreditCardNumber,
          //   expirationDateMonth,
          //   expirationDateYear,
          //   CreditCardCVV,
          //   billCompany,
          //   billAddress1,
          //   billAddress2,
          //   billFName,
          //   billLName,
          //   billCity,
          //   billState,
          //   billCountry,
          //   billZip,
          //   currency,
          //   email,
          //   phoneNumber,
          // }
          // const emailContent = await generateEmail(formData)
          // await sendEmail(emailContent)

          toast.success('Successfully paid')
          setInvoice('')
          setTotal(0)
          setCfPhysician('')
          setCFNonListedPhysician('')
          setRoutingNumber('')
          setAccountNumber('')
          setCreditCardNumber('')
          setExpirationDateMonth('')
          setExpirationDateYear('')
          setCreditCardCVV('')
          setBillCompany('')
          setBillAddress1('')
          setBillAddress2('')
          setBillFName('')
          setBillLName('')
          setBillCity('')
          setBillState('')
          setBillCountry('US')
          setBillZip('')
          setCurrency('USD')
          setPhoneNumber('')
          setEmail('')
          setErrors(null)
        }
      }
    } catch (err) {
      console.log(err)
    } finally {
      setState(false)
    }
  }

  React.useEffect(() => {
    function getQueryParams() {
      const params = {};
      const queryString = window.location.search.substring(1);
      const queries = queryString.split("&");

      queries.forEach(query => {
        const [key, value] = query.split("=");
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });

      return params;
    }

    function setInvoiceNumber() {
      try {
        const { invoice } = getQueryParams();
        setInvoice(invoice)
      } catch { }
    }

    setInvoiceNumber
  }, [])

  return (
    <div id="mainContainer" className="wrap" style={{ visibility: 'visible' }}>
      <ToastContainer />
      <div className="grid cols--2 ui-sortable">
        <div className="col ui-sortable">
          <h1 className="page__title"><i className="material-icons" aria-hidden="true" aria-label="secure">lock</i>Art Reproductive Center Payment Page</h1>
        </div>

        <div className="col ui-sortable">
          <div>
            <img className="logo" src="https://artrepcn.securepayments.cardpointe.com/images/hpp-logo.png?1525821453" alt="Art Reproductive Center" />
          </div>
        </div>
      </div>
      <div className="grid cols--1">
        <div className="col">

          <div className="form__row removable" id="invoiceNum">
            <label>Invoice Number</label>
            <span className="invoice__number">
              <span>
                <div>
                  <small>Please enter your invoice number without spaces or a dash.</small>
                </div>
                <input type="text" size="20" name="invoice" id="invoice" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
              </span>
              {errors?.invoice ? <ErrorMessage>{errors.invoice}</ErrorMessage> : null}
            </span>
          </div>
          <div className="form__row field--readonly removable">
            <label>Total Amount Due: </label>
            <span className="invoice__amount">
              <div className="form__input form__input--prefixed form__row--amount">
                <span className="currency__label">{symbol}</span>
                <input id="total" size="10" maxLength="20" name="total" className="form__input form__input--currency" type='text'
                  value={total} onChange={(e) => {
                    const inputValue = e.target.value;

                    // Remove non-numeric characters (except for decimal point)
                    let numericValue = inputValue.replace(/[^0-9.]/g, "");

                    numericValue = removeLeadingZeros(numericValue);

                    // Update the state with the formatted number
                    setTotal(formatNumber(numericValue));
                  }}
                />
              </div>
              {errors?.amount ? <ErrorMessage>{errors.amount}</ErrorMessage> : null}
            </span>
          </div>
          <div className="form__row field--select removable required">
            <label>Physician</label>
            <div className="form__input form__input--select" >
              <select name="cf_Physician" className="form__input form__input--select" id="cf_Physician" value={cf_Physician} onChange={(e) => {
                setCfPhysician(e.target.value)
              }
              }>
                <option value="">Please Select</option>
                <option value="Dr._Mark_Surrey">Dr. Mark Surrey</option>
                <option value="Dr._Hal_Danzer">Dr. Hal Danzer</option>
                <option value="Dr._Carolyn_Alexander">Dr. Carolyn Alexander</option>
                <option value="Dr._Lina_Akopians">Dr. Susan Maxwell</option>
                <option value="Physician_not_listed">Physician not listed</option>
              </select>
              {errors?.physician_name ? <ErrorMessage>{errors.physician_name}</ErrorMessage> : null}
            </div>
          </div>
          {cf_Physician === 'Physician_not_listed' && <div className="form__row field--custom removable">
            <label>Non-listed Physician?</label>
            <input name="cf_Non-listed_Physician?" className="form__input form__input--select" id="cf_Non-listed_Physician?" type="text"
              maxLength={20}
              value={cf_Non_listed_Physician}
              onChange={(e) => {
                setCFNonListedPhysician(e.target.value)
              }
              }
            />
          </div>}
        </div>
      </div>
      <div className="grid cols--2 ui-sortable">
        <div className="col ui-sortable">
          <h3 className="page__subtitle">Payment Info</h3>
          <div className="mar--t">
            <h4 className="page__desc" style={{ display: 'none' }}>Payment details</h4>
            <div>
              <div className="payment--ach" style={{ display: 'none' }}>
                <div className="form__row required">
                  <label>Routing Number</label>
                  <input name="routingNumber" className="form__input" id="routingNumber" type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                  />
                </div>
                <div className="form__row required">
                  <label>Account Number</label>
                  <input name="accountNumber" className="form__input" id="accountNumber" type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                </div>
              </div>
              <div className="payment--cc">
                <input type="hidden" name="existingCard" id="newCardRadio" value="N" />
                <div className="form__row required">
                  <label>Card Number</label>
                  <div className="form__input form__input--natural" >
                    <input type="text" name="number" size="30" id="CreditCardNumber" maxLength="550"
                      value={CreditCardNumber}
                      onChange={(e) => setCreditCardNumber(e.target.value)}
                    />
                    {errors?.card_number ? <ErrorMessage>{errors.card_number}</ErrorMessage> : null}
                  </div>
                </div>
                <div className="form__row required">
                  <label>Expiration Date</label>
                  <div className="form__input form__input--natural">
                    <select name="expirationDateMonth" id="expirationDateMonth" value={expirationDateMonth} onChange={(e) => setExpirationDateMonth(e.target.value)}>
                      <option value="" disabled>MM</option>
                      {months.map((month) => (<option value={month} key={month}>{month}</option>))}

                    </select>
                    {errors?.exp_month ? <ErrorMessage>{errors.exp_month}</ErrorMessage> : null}
                  </div>
                  <div className="form__input form__input--natural">
                    <select name="expirationDateYear" className="form__input form__input--natural" id="expirationDateYear" value={expirationDateYear} onChange={(e) => setExpirationDateYear(e.target.value)}>
                      <option value="" disabled>YYYY</option>
                      {years.map((year) => (<option value={year} key={year}>{year}</option>))}
                    </select>
                    {errors?.exp_year ? <ErrorMessage>{errors.exp_year}</ErrorMessage> : null}
                  </div>
                </div>
                <div className="form__row required">
                  <label>Security Code <small>(CVV)</small></label>
                  <div className="form__input form__input--natural">
                    <input type="text" name="CVV2" size="5" className="form__input form__input--natural" id="CreditCardCVV"
                      value={CreditCardCVV}
                      onChange={(e) => setCreditCardCVV(e.target.value)}
                    />
                    {errors?.CCV2 ? <ErrorMessage>{errors.CCV2}</ErrorMessage> : null}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                <Visa />
                <img className="card__icon" src="https://artrepcn.securepayments.cardpointe.com/admin/hpp/img/New_MasterCard.png" alt="MasterCard" title="MasterCard" />
                <Discover />
                <Express />
              </div>
            </div>
          </div>
        </div>
        <div className="col ui-sortable">
          <h3 className="page__subtitle">Billing Info</h3>
          <div>
            <div className="form__row removable">
              <label>Company Name</label>
              <input name="billCompany" autoComplete="organization" id="billCompany" className="form__input" type="text" value={billCompany} onChange={(e) => setBillCompany(e.target.value)} />
            </div>
            <div className="form__row required">
              <label>First Name</label>
              <input name="billFName" autoComplete="given-name" className="form__input" id="billFName" type="text" value={billFName} onChange={(e) => setBillFName(e.target.value)} />
              {errors?.billFName ? <ErrorMessage>{errors.billFName}</ErrorMessage> : null}
            </div>
            <div className="form__row required">
              <label>Last Name</label>
              <input name="billLName" autoComplete="family-name" className="form__input" id="billLName" type="text" value={billLName} onChange={(e) => setBillLName(e.target.value)} />
              {errors?.billLName ? <ErrorMessage>{errors.billLName}</ErrorMessage> : null}
            </div>
            <div className="form__row required">
              <label>Email</label>
              <input
                name="email"
                autoComplete="email"
                className="form__input"
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                minLength={5}
                maxLength={40}
                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                title="Please enter a valid email address"
              />
              {errors?.email ? <ErrorMessage>{errors.email}</ErrorMessage> : null}
            </div>
            <div className="form__row required">
              <label>Phone Number</label>
              <input
                name="phone_number"
                autoComplete="tel"
                className="form__input"
                id="phone_number"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              {errors?.phone_number ? <ErrorMessage>{errors.phone_number}</ErrorMessage> : null}
            </div>
            <div className="form__row required">
              <label>Address 1</label>
              <input name="billAddress1" autoComplete="address-line1" className="form__input" id="billAddress1" type="text" value={billAddress1} onChange={(e) => setBillAddress1(e.target.value)} />
              {errors?.billAddress1 ? <ErrorMessage>{errors.billAddress1}</ErrorMessage> : null}
            </div>
            <div className="form__row">
              <label>Address 2</label>
              <input name="billAddress2" autoComplete="address-line2" className="form__input" id="billAddress2" type="text" value={billAddress2} onChange={(e) => setBillAddress2(e.target.value)} />
            </div>
            <div className="form__row required">
              <label>City</label>
              <input name="billCity" autoComplete="address-city" className="form__input" id="billCity" type="text" value={billCity} onChange={(e) => setBillCity(e.target.value)} />
              {errors?.billCity ? <ErrorMessage>{errors.billCity}</ErrorMessage> : null}
            </div>
            <div className="form__row required">
              <label>State</label>
              <select name="billState" className="form__input" id="billState" type="text" value={billState} onChange={(e) => {
                setBillState(e.target.value)
              }}>
                <option value="" disabled>Select State</option>
                {states.map(({ name, isoCode: code }) => (<option value={code} key={code}>{name} ({code})</option>))}
              </select>
              {errors?.billState ? <ErrorMessage>{errors.billState}</ErrorMessage> : null}
            </div>
            <div className="form__row required">
              <label>Zip/Postal Code</label>
              <input name="billZip" autoComplete="postal-code" className="form__input" id="billZip" type="text" value={billZip} onChange={(e) => setBillZip(e.target.value)} />
              {errors?.billZip ? <ErrorMessage>{errors.billZip}</ErrorMessage> : null}
            </div>
            <div className="form__row required">
              <label>Country</label>
              <select name="billCountry" className="form__input" id="billCountry" type="text" value={billCountry}
                onChange={(e) => {
                  setBillCountry(e.target.value)
                  setBillState('')
                  setBillCity('')
                  const item = countriesCurrency[e.target.value]
                  if (item && item.currency) {
                    setCurrency(item.currency)
                  }
                }}
              >
                <option value="" disabled>Select State</option>
                {currencies.map(({ name, country }) => (<option value={country} key={country}>{name} ({country})</option>))}
              </select>
              {errors?.billCountry ? <ErrorMessage>{errors.billCountry}</ErrorMessage> : null}
            </div>
            {billCountry !== 'US' && <div className="form__row required">
              <label>Currency</label>
              <select name="currency" className="form__input" id="currency" type="text" value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value)
                }}
              >
                <option value="" disabled>Select State</option>
                {uniqueCurrencies.map(({ currency, symbol }) => (<option value={currency} key={currency}>{currency}({symbol})</option>))}
              </select>
              {errors?.currency ? <ErrorMessage>{errors.currency}</ErrorMessage> : null}
            </div>}
          </div>
        </div>
      </div>
      <div className="form__row">
        <TurnstileWidget
          onToken={setTurnstileToken}
          onError={() => {
            setTurnstileToken('')
            toast.error('Security verification failed. Please try again.')
          }}
        />
      </div>
      <div className="form__row">
        <Button type="submit" className="form__submit" onClick={() => submit()} variant="contained" disabled={state}>{state ? 'Submitting' : 'Submit Payment'}</Button>
        <div style={{ maxWidth: 500, margin: '10px 5px' }}>
          Please press 'Submit Payment' only once. Transaction may take up to 10 seconds to process. An approval message will appear in the top-right corner when complete.
        </div>
      </div>
    </div>
  );
}
