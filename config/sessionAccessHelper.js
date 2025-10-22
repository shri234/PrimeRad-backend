/**
 
 * @param {Array} sessions 
 * @param {Object} userAccess 
 * @param {number} freeLimit 
 * @returns {Array} 
 */
function applySessionAccessControl(sessions, userAccess, freeLimit = 2) {
  const { isLoggedIn, isSubscribed } = userAccess;

  // If subscribed, return all sessions unlocked
  if (isSubscribed) {
    return sessions.map((session) => ({
      ...session,
      isLocked: false,
      accessLevel: "subscribed",
    }));
  }

  // Get all free sessions
  const freeSessions = sessions.filter((s) => s.isFree === true);
  const paidSessions = sessions.filter((s) => s.isFree !== true);

  let accessibleSessions = [];
  let lockedSessions = [];

  if (!isLoggedIn) {
    // Not logged in: Show only 2 random free sessions, rest locked
    const randomFreeSessions = shuffleArray(freeSessions).slice(0, freeLimit);

    accessibleSessions = randomFreeSessions.map((session) => ({
      ...session,
      isLocked: false,
      accessLevel: "guest",
    }));

    // All other sessions are locked (show limited info)
    const remainingSessions = [
      ...freeSessions.filter((s) => !randomFreeSessions.includes(s)),
      ...paidSessions,
    ];

    lockedSessions = remainingSessions.map((session) => ({
      ...sanitizeLockedSession(session),
      isLocked: true,
      accessLevel: "guest",
      lockReason: "Please login to access more content",
    }));
  } else {
    // Logged in but not subscribed: Show 5-6 free sessions, rest locked
    const loggedInFreeLimit = Math.min(freeLimit + 3, freeSessions.length);
    const accessibleFreeSessions = freeSessions.slice(0, loggedInFreeLimit);

    accessibleSessions = accessibleFreeSessions.map((session) => ({
      ...session,
      isLocked: false,
      accessLevel: "loggedIn",
    }));

    // Remaining free sessions + all paid sessions are locked
    const remainingSessions = [
      ...freeSessions.slice(loggedInFreeLimit),
      ...paidSessions,
    ];

    lockedSessions = remainingSessions.map((session) => ({
      ...sanitizeLockedSession(session),
      isLocked: true,
      accessLevel: "loggedIn",
      lockReason: "Subscribe to access this content",
    }));
  }

  return [...accessibleSessions, ...lockedSessions];
}

/**
 * Sanitizes locked session data (hide sensitive info)
 */
function sanitizeLockedSession(session) {
  return {
    _id: session._id,
    title: session.title,
    description: session.description?.substring(0, 100) + "..." || "",
    imageUrl_1920x1080: session.imageUrl_1920x1080,
    imageUrl_522x760: session.imageUrl_522x760,
    difficulty: session.difficulty,
    moduleName: session.moduleName,
    pathologyName: session.pathologyName,
    createdAt: session.createdAt,
    isFree: session.isFree,
    sessionType: session.sessionType,
    faculty: session.faculty,
    // Hide video URLs, DICOM IDs, Zoom links, etc.
  };
}

/**
 * Shuffle array randomly (Fisher-Yates algorithm)
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = {
  applySessionAccessControl,
  sanitizeLockedSession,
  shuffleArray,
};
