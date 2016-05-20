import {
  Schema,
  arrayOf,
  unionOf,
  valuesOf,
  normalize
}
from 'normalizr';
import {
  camelizeKeys
} from 'humps'

import assign from "lodash/assign";

import 'isomorphic-fetch';

const API_ROOT = 'http://54.213.83.132/hackoregon/http/';

function callApi(endpoint, schema) {
  const fullUrl = (endpoint.indexOf(API_ROOT) === -1) ? API_ROOT + endpoint : endpoint;
  return fetch(fullUrl)
    .then((response) => {
      return response.json().then(json => ({
        json,
        response
      }))
      return {
        json,
        response
      }
    }).then(({
      json,
      response
    }) => {
      if (!response.ok) {
        return Promise.reject(json)
      }

      const camelizedJson = camelizeKeys(json);
      return normalize(camelizedJson, schema)
    })
}

const campaign = new Schema('campaigns', {
  idAttribute: 'filerId'
});
const donor = new Schema('donors', {
  idAttribute: 'contributorPayee'
});
const transaction = new Schema('transactions', {
  idAttribute: 'tranId'
});

const list = {
  campaigns: campaign
};

// const contribution = new Schema('contributions', {
//   idAttribute: 'contributorPayee'
// });

const stateSummary = new Schema('stateSummary',{
  // This is just to make normalizr happy.
  // There's not multiple statse at this point, so there's not unique id, so I just chose something from the json result.
  idAttribute: 'total_from_in_state'
});

const stateContribution = new Schema('stateContributions',{
  idAttribute: 'state'
});

const indivContribution = new Schema('indivContributions', {
  idAttribute: 'contributorPayee'
});

const pacContribution = new Schema('pacContributions', {
  idAttribute: 'contributorPayee'
});
const businessContribution = new Schema('businessContributions', {
  idAttribute: 'contributorPayee'
});

const contributions = ({
  owner: campaign,
  individual: arrayOf(indivContribution),
  business: arrayOf(businessContribution),
  pac: arrayOf(pacContribution),
  states: arrayOf(stateContribution)
})

campaign.define({
  listByName: valuesOf(campaign, {
    schemaAttribute: 'candidateName'
  })
})


const search = new Schema('searches');

search.define({
  list: arrayOf(campaign)
});

// contribution.define({
//   owner: campaign
// });



indivContribution.define({
  owner: campaign,
  listByType: valuesOf(transaction, {
    schemaAttribute: 'bookType'
  })
});

donor.define({
  owner: transaction,
  listByName: valuesOf(transaction, {
    schemaAttribute: 'contributorPayee'
  }),
  relationships: valuesOf(campaign)
});

export const Schemas = {
  CAMPAIGN: campaign,
  CAMPAIGN_ARRAY: arrayOf(campaign),
  TRANSACTION: transaction,
  TRANSACTION_ARRAY: arrayOf(transaction),
  DONOR: donor,
  DONOR_ARRAY: arrayOf(donor),
  LIST: list,
  STATE_CONTRIBUTION: stateContribution,
  STATE_CONTRIBUTION_ARRAY: arrayOf(stateContribution),
  INDIV_CONTRIBUTION: indivContribution,
  INDIV_CONTRIBUTION_ARRAY: arrayOf(indivContribution),
  BIZ_CONTRIBUTION: businessContribution,
  BIZ_CONTRIBUTION_ARRAY: arrayOf(businessContribution),
  PAC_CONTRIBUTION: pacContribution,
  PAC_CONTRIBUTION_ARRAY: arrayOf(pacContribution),
  STATE_SUMMARY: stateSummary
}

export const CALL_API = Symbol('Call API');

export default store => next => action => {

  const callAPI = action[CALL_API]

  if (typeof callAPI === 'undefined') {
    return next(action)
  }
  let {
    endpoint
  } = callAPI
  const {
    schema,
    types
  } = callAPI

  if (typeof endpoint === 'function') {
    endpoint = endpoint(store.getState())
  }

  if (typeof endpoint !== 'string') {
    throw new Error('Specify a string endpoint URL.')
  }
  if (!schema) {
    throw new Error('Specify one of the exported Schemas.')
  }
  if (!Array.isArray(types) || types.length !== 3) {
    throw new Error('Expected an array of three action types.')
  }
  if (!types.every(type => typeof type === 'string')) {
    throw new Error('Expected action types to be strings.')
  }

  function actionWith(data) {
    const finalAction = assign({}, action, data)
    delete finalAction[CALL_API]
    return finalAction
  }

  const [requestType, successType, failureType] = types
  next(actionWith({
    type: requestType
  }))

  return callApi(endpoint, schema).then(
    response => next(actionWith({
      response,
      type: successType
    })),
    error => next(actionWith({
      type: failureType,
      error: error.message || 'Something bad happened'
    }))
  )
}
