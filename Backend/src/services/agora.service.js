import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

const TOKEN_EXPIRY = 3600 * 24; // 1 day in seconds

export const generateAgoraToken = (channelName, uid, role = "publisher") => {
    const APP_ID = process.env.AGORA_APP_ID;
    const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

    const TOKEN_EXPIRY = 3600 * 24; // 1 day in seconds
    try {
        if (!APP_ID || !APP_CERTIFICATE) {
            console.error('AGORA_APP_ID:', APP_ID, 'AGORA_APP_CERTIFICATE:', APP_CERTIFICATE);
            throw new Error('Agora App ID and Certificate must be set in environment variables');
        }
        if (!channelName || !uid) {
            throw new Error('channelName and uid are required to generate Agora token');
        }
        const agoraRole = role === "publisher"
            ? RtcRole.PUBLISHER
            : RtcRole.SUBSCRIBER;
        const expirationTime = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY;
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            agoraRole,
            expirationTime
        );
        return token;
    } catch (error) {
        console.error('Error generating Agora token:', {
            message: error.message,
            stack: error.stack,
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            role
        });
        throw error;
    }
};