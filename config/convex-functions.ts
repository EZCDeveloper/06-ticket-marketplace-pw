/**
 * Convex Function Registry
 *
 * Centralizes all Convex query and mutation path strings.
 * If a function is renamed in the backend, update it here — one place, all tests fixed.
 *
 * Convention: CONVEX_FN.<domain>.<functionName>
 */
export const CONVEX_FN = {
    events: {
        create:        'events:create',
        getById:       'events:getById',
        get:           'events:get',
        cancelEvent:   'events:cancelEvent',
        updateEvent:   'events:updateEvent',
        joinWaitingList:     'events:joinWaitingList',
        getUserWaitingList:  'events:getUserWaitingList',
        purchaseTicket:      'events:purchaseTicket',
    },
    users: {
        updateUser:  'users:updateUser',
        getUserById: 'users:getUserById',
    },
    waitingList: {
        getQueuePosition: 'waitingList:getQueuePosition',
    },
    dbCleanup: {
        removeEventAndTickets:  'dbCleanup:removeEventAndTickets',
        removeTicketsByDate:    'dbCleanup:removeTicketsByDate',
    },
} as const;

export type ConvexFnPath = typeof CONVEX_FN[keyof typeof CONVEX_FN][string];
