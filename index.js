const dotenv = require('dotenv').config();
if (dotenv.error) {
    throw dotenv.error;
}

//Plan to make it more secure in the future, might be a problem on mofh's end though
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const axios = require('axios');
const querystring = require('querystring');
const parseXMLFunc = require('xml2js').parseString;

/**
 * converts XML to JSON-like output
 *
 * @param {xml} xml xml that is converted
 * @returns {string} the json-like output
 * @ignore
 */
function parseXML(xml) {
    var res = '';
    parseXMLFunc(xml, function (err, result) {
        res = result;
    });
    return res;
}

/**
 * check if a variable/data is null/undefined
 *
 * @param {any} data the variable/data to check
 * @returns {boolean} whether the variable/data was equal to null/undefined or not
 * @ignore
 */
function isNullUnd(data) {
    var res;
    if (data == null || data == undefined) {
        res = true;
    } else {
        res = false;
    }
    return res;
}

/**
 * Checks to see if a value is set.
 *
 * @param {Function} accessor Function that returns our value
 * @returns {boolean} whether the value is set or not
 * @ignore
 */
function isset(accessor) {
    try {
        // Note we're seeing if the returned value of our function is not
        // undefined
        return typeof accessor() !== 'undefined'
    } catch (e) {
        // And we're able to catch the Error it would normally throw for
        // referencing a property of undefined
        return false
    }
}

/**
 * get a list of a user's domains w/ status
 *
 * ```javascript
 * //returns '{"success": true, "message": [["status e.g. ACTIVE", "the url"], etc.], "error": ''}'
 * const mofh = require('mofh-client');
 * console.log(mofh.getUserDomains('validusername'));
 * ```
 *
 * @async
 * @param {string} username The unique, 8 character identifier of the account.
 * @returns {json-string} "success": whether or not you should be showing the response to the user. "message": either be empty array (i.e. an error occured or no domains found) or contain array of websites in the form of `[["status e.g. ACTIVE", "the url"], etc.]`. "error": the error, if there is one
 *
 */
const getUserDomains = async (username) => {
    var list = [];
    var res = {};
    try {
        const response = await axios.post('https://panel.myownfreehost.net:2087/xml-api/getuserdomains.php', querystring.stringify({
            api_user: process.env.mofh_api_user,
            api_key: process.env.mofh_api_key,
            username: username,
        }), {
                httpsAgent: httpsAgent,
            });

        const body = await response.data;
        if (isNullUnd(body)) {
            res = JSON.stringify({
                success: false,
                message: [],
                error: 'null/undefined response',
            });
            console.log(res);
            return res;
        } else {
            if (!((body).includes("ERROR"))) {
                list = body;
                res = JSON.stringify({
                    success: true,
                    message: list,
                    error: '',
                });
                console.log(res);
                return res;
            } else {
                list = [];
                res = JSON.stringify({
                    success: false,
                    message: list,
                    error: body,
                });
                console.log(res);
                return res;
            }
        }
    } catch (error) {
        console.log(error);
        res = JSON.stringify({
            success: false,
            message: [],
            error: error,
        });
        console.log(res);
        return res;
    }
}

/**
 * get availability of a domain
 *
 * ```javascript
 * //returns '{"success": true, "message": 1, "error": ''}'
 * const mofh = require('mofh-client');
 * console.log(mofh.getUserDomains('valid.domain.com'));
 * ```
 *
 * @async
 * @param {string} domain The domain name or subdomain to check.
 * @returns {json-string} "success": whether or not you should be showing the response to the user. "message": either be 0 (not available/failed to check) or 1 (available+succeeded). "error": the error, if there is one
 */
const getAvailability = async (domain) => {
    var isav = null;
    var res = {};
    try {
        const response = await axios.post('https://panel.myownfreehost.net:2087/xml-api/checkavailable.php', querystring.stringify({
            api_user: process.env.mofh_api_user,
            api_key: process.env.mofh_api_key,
            domain: domain,
        }), {
                httpsAgent: httpsAgent,
            });

        const body = await response.data;
        if (isNullUnd(body)) {
            res = JSON.stringify({
                success: false,
                message: 0,
                error: 'null/undefined response',
            });
            console.log(res);
            return res;
        } else {
            if (!((body).includes("ERROR"))) {
                isav = body;
                res = JSON.stringify({
                    success: true,
                    message: isav,
                    error: '',
                });
                console.log(res);
                return res;
            } else {
                isav = 0;
                res = JSON.stringify({
                    success: false,
                    message: isav,
                    error: body,
                });
                console.log(res);
                return res;
            }
        }
    } catch (error) {
        console.log(error);
        res = JSON.stringify({
            success: false,
            message: 0,
            error: error,
        });
        console.log(res);
        return res;
    }
}

/**
 * create an account on MOFH
 *
 * ```javascript
 * //returns '{"success": true, "message": 1, "error": ''}'
 * const mofh = require('mofh-client');
 * console.log(mofh.createAccount('username', 'password', 'email@email.com', 'valid.domain.com', 'freeplan01'));
 * ```
 *
 * @async
 * @param {string} username A unique, 8 character identifier of the account.
 * @param {string} password their password to login to the control panel, FTP and databases.
 * @param {string} email their email.
 * @param {string} domain their domain. Can be a subdomain or a custom domain.
 * @param {string} plan  the hosting plan to create the account on. Requires a hosting package to be configured through MyOwnFreeHost.
 * @returns {json-string} "success": whether or not you should be showing the response to the user. "message": `{ "status": 1 or 0 depending on success, "statusmsg": the response of the request, "vpusername": their vistapanel username if success, }`. "error": the error, if there is one
 */
const createAccount = async (username, password, email, domain, plan) => {
    var result = null;
    var res = {};
    try {
        const response = await axios.post('https://panel.myownfreehost.net:2087/xml-api/createacct.php', querystring.stringify({
            username: username,
            password: password,
            contactemail: email,
            domain: domain,
            plan: plan,
        }),
            {
                httpsAgent: httpsAgent,
                auth: {
                    username: process.env.mofh_api_user,
                    password: process.env.mofh_api_key,
                },
            });

        const body = await response.data;
        if (isNullUnd(body)) {
            result = JSON.stringify({ "status": 0, "statusmsg": 'null/undefined response', "vpusername": 'none', });
            res = JSON.stringify({
                success: false,
                message: result,
                error: 'null/undefined response',
            });
            console.log(res);
            return res;
        } else {
            var status = 0;
            var statusmsg = 'none';
            var vpusername = 'none';
            if (isset(() => parseXML(body)['createacct']['result'][0]['statusmsg'][0])) {
                statusmsg = parseXML(body)['createacct']['result'][0]['statusmsg'][0];
                if (parseXML(body)['createacct']['result'][0]['status'][0] === '1') {
                    vpusername = parseXML(body)['createacct']['result'][0]['options'][0]['vpusername'][0];
                    status = 1;
                    result = JSON.stringify({ "status": status, "statusmsg": statusmsg, "vpusername": vpusername, });
                    res = JSON.stringify({
                        success: true,
                        message: result,
                        error: '',
                    });
                    console.log(res);
                    return res;
                } else {
                    status = 0;
                    result = JSON.stringify({ "status": status, "statusmsg": statusmsg, "vpusername": 'none', });
                    res = JSON.stringify({
                        success: false,
                        message: result,
                        error: statusmsg,
                    });
                    console.log(res);
                    return res;
                }
            } else {
                result = JSON.stringify({ "status": 0, "statusmsg": body, "vpusername": 'none', });
                res.json({
                    success: false,
                    message: result,
                    error: body,
                });
                res = JSON.stringify({
                    success: false,
                    message: result,
                    error: body,
                });
                console.log(res);
                return res;
            }
        }
    } catch (error) {
        console.log(error);
        result = JSON.stringify({ "status": 0, "statusmsg": error, "vpusername": 'none', });
        res = JSON.stringify({
            success: false,
            message: result,
            error: error,
        });
        console.log(res);
        return res;
    }
}


/**
 * reset a user's password
 *
 * ```javascript
 * //returns '{"success": true, "message": 1, "error": ''}'
 * const mofh = require('mofh-client');
 * console.log(mofh.resetPassword('username', 'newpassword'));
 * ```
 *
 * @async
 * @param {string} username  The unique, 8 character identifier of the account.
 * @param {string} password their new password
 * @returns {json-string} "success": whether or not you should be showing the response to the user. "message": `{ "status": 1 or 0 depending on success, "statusmsg": 'Success' or error containing response and letter x for suspended, r for reactivating, and c for closing,}`. "error": the error, if there is one
 */
const resetPassword = async (username, password) => {
    var result = null;
    var res = {};
    try {
        const response = await axios.post('https://panel.myownfreehost.net:2087/xml-api/passwd.php', querystring.stringify({
            user: username,
            pass: password,
        }),
            {
                httpsAgent: httpsAgent,
                auth: {
                    username: process.env.mofh_api_user,
                    password: process.env.mofh_api_key,
                },
            });

        const body = await response.data;
        if (isNullUnd(body)) {
            result = JSON.stringify({ "status": 0, "statusmsg": 'null/undefined response' });
            res = JSON.stringify({
                success: false,
                message: result,
                error: 'null/undefined response',
            });
            console.log(res);
            return res;
        } else {
            var status = 0;
            var statusmsg = 'none';
            /**
                * Get the status of the account if the account is not active.
                *
                * The result will contain one of the following chars:
                * - x: suspended
                * - r: reactivating
                * - c: closing
                * ``` */
            if (isset(() => parseXML(body)['passwd']['passwd'][0]['statusmsg'][0])) {
                statusmsg = parseXML(body)['passwd']['passwd'][0]['statusmsg'][0];
                if ((statusmsg).includes("This account currently not active, the account must be active to change the password")) {
                    result = JSON.stringify({ "status": 0, "statusmsg": statusmsg, });
                    res = JSON.stringify({
                        success: false,
                        message: result,
                        error: 'null/undefined response',
                    });
                    console.log(res);
                    return res;
                } else if ((statusmsg).includes("An error occured changing this password.")) {
                    //The password is identical (which is technically identical to be being changed successfully)
                    result = JSON.stringify({ "status": 1, "statusmsg": 'Success', });
                    res = JSON.stringify({
                        success: true,
                        message: result,
                        error: '',
                    });
                    console.log(res);
                    return res;
                } else if (parseXML(body)['passwd']['passwd'][0]['status'][0] === '1') {
                    status = 1;
                    result = JSON.stringify({ "status": status, "statusmsg": 'Success', });
                    res = JSON.stringify({
                        success: true,
                        message: result,
                        error: '',
                    });
                    console.log(res);
                    return res;
                } else {
                    status = 0;
                    result = JSON.stringify({ "status": status, "statusmsg": statusmsg, });
                    res = JSON.stringify({
                        success: false,
                        message: result,
                        error: statusmsg,
                    });
                    console.log(res);
                    return res;
                }
            } else {
                result = JSON.stringify({ "status": 0, "statusmsg": body, });
                res = JSON.stringify({
                    success: false,
                    message: result,
                    error: body,
                });
                console.log(res);
                return res;
            }
        }
    } catch (error) {
        console.log(error);
        result = JSON.stringify({ "status": 0, "statusmsg": error, });
        res = JSON.stringify({
            success: false,
            message: result,
            error: error,
        });
        console.log(res);
        return res;
    }
}

/**
 * suspend an account
 *
 * ```javascript
 * //returns '{"success": true, "message": 1, "error": ''}'
 * const mofh = require('mofh-client');
 * console.log(mofh.suspendAccount('username', 'innapropriate content'));
 * ```
 *
 * @async
 * @param {string} username The unique, 8 character identifier of the account.
 * @param {string} reason Information about why you are suspending the account. at least 5 chars long.
 * @returns {json-string} "success": whether or not you should be showing the response to the user. "message": `{ "status": 1 or 0 depending on success, "statusmsg": non existant if success, error response if fail}`. "error": the error, if there is one
 */
const suspendAccount = async (username, reason) => {
    var result = null;
    var res = {};
    try {
        const response = await axios.post('https://panel.myownfreehost.net:2087/xml-api/suspendacct.php', querystring.stringify({
            user: username,
            reason: reason,
        }),
            {
                httpsAgent: httpsAgent,
                auth: {
                    username: process.env.mofh_api_user,
                    password: process.env.mofh_api_key,
                },
            });

        const body = await response.data;
        if (isNullUnd(body)) {
            result = JSON.stringify({ "status": 0, "statusmsg": 'null/undefined response' });
            res = JSON.stringify({
                success: false,
                message: result,
                error: 'null/undefined response',
            });
            console.log(res);
            return res;
        } else {
            var status = 'none';
            var statusmsg = 'none';
            if (isset(() => parseXML(body)['suspendacct']['result'][0]['status'][0])) {
                status = parseXML(body)['suspendacct']['result'][0]['status'][0];
                if (status === '1') {
                    result = JSON.stringify({ "status": 1 });
                    res = JSON.stringify({
                        success: true,
                        message: result,
                        error: '',
                    });
                    console.log(res);
                    return res;
                } else {
                    statusmsg = parseXML(response.data)['suspendacct']['result'][0]['statusmsg'][0];
                    result = JSON.stringify({ "status": 0, "statusmsg": statusmsg, });
                    res = JSON.stringify({
                        success: false,
                        message: result,
                        error: statusmsg,
                    });
                    console.log(res);
                    return res;
                }
            } else {
                result = JSON.stringify({ "status": 0, "statusmsg": body, });
                res = JSON.stringify({
                    success: false,
                    message: result,
                    error: body,
                });
                console.log(res);
                return res;
            }
        }
    } catch (error) {
        console.log(error);
        result = JSON.stringify({ "status": 0, "statusmsg": error, });
        res = JSON.stringify({
            success: false,
            message: result,
            error: error,
        });
        console.log(res);
        return res;
    }
}

/**
 * unsuspend an account
 *
 * ```javascript
 * //returns '{"success": true, "message": 1, "error": ''}'
 * const mofh = require('mofh-client');
 * console.log(mofh.suspendAccount('username', 'innapropriate content'));
 * ```
 *
 * @async
 * @param {string} username The unique, 8 character identifier of the account.
 * @returns {json-string} "success": whether or not you should be showing the response to the user. "message": `{ "status": 1 or 0 depending on success, "statusmsg": non existant if success, error response if fail}`. "error": the error, if there is one
 */
const unsuspendAccount = async (username) => {
    var result = null;
    var res = {};
    try {
        const response = await axios.post('https://panel.myownfreehost.net:2087/xml-api/unsuspendacct.php', querystring.stringify({
            user: username,
        }),
            {
                httpsAgent: httpsAgent,
                auth: {
                    username: process.env.mofh_api_user,
                    password: process.env.mofh_api_key,
                },
            });

        const body = await response.data;
        if (isNullUnd(body)) {
            result = JSON.stringify({ "status": 0, "statusmsg": 'null/undefined response' });
            res = JSON.stringify({
                success: false,
                message: result,
                error: 'null/undefined response',
            });
            console.log(res);
            return res;
        } else {
            var status = 'none';
            var statusmsg = 'none';
            if (isset(() => parseXML(body)['unsuspendacct']['result'][0]['status'][0])) {
                status = parseXML(body)['unsuspendacct']['result'][0]['status'][0];
                if (status === '1') {
                    result = JSON.stringify({ "status": 1 });
                    res = JSON.stringify({
                        success: true,
                        message: result,
                        error: '',
                    });
                    console.log(res);
                    return res;
                } else {
                    statusmsg = parseXML(response.data)['unsuspendacct']['result'][0]['statusmsg'][0];
                    result = JSON.stringify({ "status": 0, "statusmsg": statusmsg, });
                    res = JSON.stringify({
                        success: false,
                        message: result,
                        error: statusmsg,
                    });
                    console.log(res);
                    return res;
                }
            } else {
                result = JSON.stringify({ "status": 0, "statusmsg": body, });
                res = JSON.stringify({
                    success: false,
                    message: result,
                    error: body,
                });
                console.log(res);
                return res;
            }
        }
    } catch (error) {
        console.log(error);
        result = JSON.stringify({ "status": 0, "statusmsg": error, });
        res = JSON.stringify({
            success: false,
            message: result,
            error: error,
        });
        console.log(res);
        return res;
    }
}

module.exports = {
    getUserDomains,
    getAvailability,
    createAccount,
    resetPassword,
    suspendAccount,
    unsuspendAccount,
};
