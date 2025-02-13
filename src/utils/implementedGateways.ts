import * as _ from 'lodash';
import { getCustomerTargetUrl } from './baseUrlHelpers';

let ImplementedGateways: GatewayDto[];

ImplementedGateways = [
  {
    name: 'diar',
    label: 'Diar DZAIR',
    logoUrl: '',
    domain: 'diardzair.com.dz',
    currencies: ['DZD']
  },
  {
    name: 'paystack',
    label: 'Paystack',
    logoUrl: `${getCustomerTargetUrl()}/paystack.png`,
    domain: 'paystack.com',
    currencies: ['NGN'],
    subGateways: ['banks_direct', 'cards']
  },
  {
    name: 'ipn',
    label: 'Instapay',
    logoUrl: '',
    domain: 'instapay.com',
    currencies: ['EGP']
  },
  {
    name: 'premiumcard',
    label: 'Premium Card',
    logoUrl: '',
    domain: 'premiumcard.net',
    currencies: ['EGP']
  },
  {
    name: 'spotit',
    label: 'Spotit',
    logoUrl: `${getCustomerTargetUrl()}/spotit.png`,
    domain: 'craftsilicon.com',
    currencies: ['KES'],
    mailingList: [
      'pramodkumar.s@craftsilicon.com',
      'cindy.muthama@craftsilicon.com',
      'eva.njagi@craftsilicon.com',
      'fokwaro@craftsilicon.com',
      'betty.nyaberi@craftsilicon.com',
      'benjamin.chipinde@craftsilicon.com',
      'sujit.saini@craftsilicon.com',
      'bhaven@craftsilicon.com',
      'philip.otieno@jumia.com',
      'dorah.owiyo@jumia.com',
      'ines.oliva@jumia.com',
      'betty.kimathi@jumia.com',
      'lucy.ngugi@jumia.com',
      'martin.gacharu@jumia.com',
      'tracy.njuguna@jumia.com',
      'andrew.arumba@jumia.com',
      'felix.mutisya@jumia.com',
      'paul.wahome@jumia.com',
      'ana.pinto@jumia.com',
      'diogo.pinho@jumia.com',
      'mary.wamwea@jumia.com',
      'marveen.oloo@craftsilicon.com',
      'finance@craftsilicon.com'
    ]
  },

  {
    name: 'forsa',
    label: 'Forsa',
    logoUrl: ``,
    domain: 'forsa.com',
    currencies: ['EGP']
  },
  {
    name: 'contact',
    label: 'Contact',
    logoUrl: `${getCustomerTargetUrl()}/contact-logo.png`,
    domain: 'contact.eg',
    currencies: ['EGP']
  },
  {
    name: 'opay',
    label: 'OPay',
    logoUrl: `${getCustomerTargetUrl()}/opay-logo.png`,
    domain: 'opaycheckout.com',
    currencies: ['NGN'],
    subGateways: ['wallet']
  },
  {
    name: 'palmpay',
    label: 'PalmPay',
    logoUrl: `${getCustomerTargetUrl()}/palmpay-logo.png`,
    domain: 'palmpay.com',
    currencies: ['NGN'],
    subGateways: ['wallet']
  },
  {
    name: 'souhoola',
    label: 'Souhoola',
    logoUrl: `${getCustomerTargetUrl()}/souhoola.png`,
    domain: 'souhoola.com',
    mailingList: ['operations@souhoola.com', 'mohamed.gamal@souhoola.com'],
    currencies: ['EGP']
  },
  {
    name: 'credpal',
    label: 'Credpal',
    logoUrl: `${getCustomerTargetUrl()}/credpal.png`,
    domain: 'credpal.com',
    mailingList: [],
    currencies: ['NGN']
  },
  {
    name: 'easybuy',
    label: 'Easybuy',
    logoUrl: `${getCustomerTargetUrl()}/easybuy-logo.png`,
    domain: 'newedgefinance.com',
    currencies: ['NGN']
  },
  {
    name: 'orange',
    label: 'Orange',
    logoUrl: `${getCustomerTargetUrl()}/orange-money.png`,
    domain: 'orange.com',
    currencies: ['XOF']
  },

  {
    name: 'binga',
    label: 'Binga',
    logoUrl: `${getCustomerTargetUrl()}/binga.png`,
    domain: 'binga.ma',
    currencies: ['MAD']
  }
];

export function getGateway(gatewayName: string): GatewayDto {
  gatewayName = _.split(gatewayName, '@')[0];
  gatewayName = gatewayName.replace('-stg', '');
  const gateway: GatewayDto = _.find(ImplementedGateways, (gateway: GatewayDto) => gateway.name === gatewayName);

  return gateway;
}
export const implementedGateways = ImplementedGateways;

export function isGatewayRunning(gatewayName: string): {
  isImplemented: boolean;
  isRunning: boolean;
} {
  const nameSplit = gatewayName.split('@');
  const subGateway = nameSplit.length > 1 ? nameSplit[1] : null;
  const gateway = nameSplit[0];

  const gatewayObj = getGateway(gateway);

  let isImplemented = false;
  let isRunning = true;
  if (gatewayObj) {
    if (subGateway) {
      if (gatewayObj.subGateways && gatewayObj.subGateways.includes(subGateway)) isImplemented = true;
    } else isImplemented = true;
  }

  // UGLY CODE; DELETE ONE DAY WHEN JUMIA FIXES THEIR MESS
  if (gateway == 'souhoola_fashion' || gateway == 'souhoola_fashion-stg') isImplemented = true;
  // END OF UGLY CODE

  return {
    isImplemented,
    isRunning
  };
}

export class GatewayDto {
  name: string;
  label: string;
  logoUrl: string;
  domain: string;
  mailingList?: string[];
  currencies?: string[];
  subGateways?: string[];
}
