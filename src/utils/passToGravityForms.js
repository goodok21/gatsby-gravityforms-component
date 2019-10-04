import axios from 'axios'

export default async ({
    baseUrl,
    values: formData,
    lambda: lambdaEndpoint,
    verifyKey,
}) => {
    let lambaData = {
        baseUrl: baseUrl,
        payload: formData,
        verifyKey,
    }

    let result

    try {
        result = await axios.post(lambdaEndpoint, {
            responseType: 'json',
            withCredentials: true,
            crossdomain: true,
            data: lambaData,
        })
    } catch (err) {
        // Pass back error
        return {
            status: 'error',
            data: err.response,
        }
    }

    return {
        status: 'success',
        data: result,
    }
}
