import { replace } from 'react-router-redux'
import {
  CLEARED_SEARCH_RESULTS,
  SEARCHED_USERS,
} from '../constants/ActionTypes'
import { receiveUsers } from '../actions'
import {
  // fromPromise,
  just,
} from 'most'
import {
  curriedChain as chain,
  curriedFilter as filter,
  curriedMap as map,
  curriedMerge as merge,
  curriedSwitchMap as switchMap,
  curriedUntil as until,
  fetchJsonStream,
} from '../utils'
import { select } from 'redux-most'
// import { select } from '../../../src/index'
import { compose } from 'ramda'

const toQuery = ({ payload }) => payload.query

const whereNotEmpty = query => !!query

const toItems = ({ items }) => items

const getUsersQueryUrl = query =>
  `https://api.github.com/search/users?q=${query}`

const replaceQuery = q => replace(`?q=${q}`)

// Fluent style
// const searchUsers = action$ =>
//   action$.thru(select(SEARCHED_USERS))
//     .map(toQuery)
//     .filter(whereNotEmpty)
//     .map(q =>
//       just()
//       .until(action$.thru(select(CLEARED_SEARCH_RESULTS)))
//       .chain(_ =>
//         merge(
//           just(replaceQuery(q)),
//           fromPromise(
//             fetch(getUsersQueryUrl(q))
//             .then(response => response.json())
//           )
//           .map(toItems)
//           .map(receiveUsers)
//         )
//       )
//     ).switch()

// Functional style
// const searchUsers = action$ => {
//   const searchedUsers$ = select(SEARCHED_USERS, action$)
//   const maybeEmptyQuery$ = map(toQuery, searchedUsers$)
//   const query$ = filter(whereNotEmpty, maybeEmptyQuery$)

//   const untilCleared$ = until(
//     select(CLEARED_SEARCH_RESULTS, action$),
//     just()
//   )

//   const parseJsonForUsers = q =>
//     map(toItems, fetchJsonStream(getUsersQueryUrl(q)))

//   const fetchReplaceReceive = q => merge(
//     just(replaceQuery(q)),
//     map(receiveUsers, parseJsonForUsers(q))
//   )

//   const fetchReplaceReceiveUntilCleared = q =>
//     chain(_ => fetchReplaceReceive(q), untilCleared$)

//   return switchMap(fetchReplaceReceiveUntilCleared, query$)
// }

// Using functional composition & simplifying where possible
const searchUsers = action$ => {
  const toFlattenedOutput = q => chain(
    _ => merge(
      just(replaceQuery(q)),
      compose(
        map(compose(receiveUsers, toItems)),
        fetchJsonStream,
        getUsersQueryUrl
      )(q)
    ),
    until(select(CLEARED_SEARCH_RESULTS, action$), just())
  )

  return compose(
    switchMap(toFlattenedOutput),
    filter(whereNotEmpty),
    map(toQuery),
    select(SEARCHED_USERS)
  )(action$)
}

export default searchUsers
