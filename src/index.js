import React, { useState } from 'react'
import ReactHtmlParser from 'react-html-parser'
import PropTypes from 'prop-types'
import useForm from 'react-hook-form/dist/react-hook-form.ie11'
import getForm from './utils/getForm'
import FieldBuilder from './container/FieldBuilder'
import FormGeneralError from './components/FormGeneralError'
import { doesObjectExist, isObjEmpty } from './utils/helpers'
import {
    handleGravityFormsValidationErrors,
    // manageMainFormError,
} from './utils/manageErrors'
import { submissionHasOneFieldEntry } from './utils/manageFormData'
import passToGravityForms from './utils/passToGravityForms'

/**
 * Component to take Gravity Form graphQL data and turn into
 * a fully functional form.
 * @param mixed     formData    Form dataset from graphQL
 * @param int       id          Form ID from Gravity Forms
 * @param string    lambda      API link for Lambda functions when working with
 *                              netlify or similar
 */

const GravityFormForm = ({
    id,
    formData,
    lambda,
    presetValues = {},
    reCaptchaKey,
    reCaptchaLoaded,
}) => {
    // Pull in form functions
    const { register, errors, handleSubmit, setError } = useForm()

    const [generalError, setGeneralError] = useState('')
    const [formLoading, setLoadingState] = useState(false)

    // State for confirmation message
    const [confirmationMessage, setConfirmationMessage] = useState('')

    // Take ID argument and graphQL Gravity Form data for this form
    const singleForm = getForm(formData, id)

    const onSubmitCallback = async values => {
        // Make sure we are not already waiting for a response
        if (!formLoading) {
            setLoadingState(true)

            // Clean error
            setGeneralError('')

            // Check that at least one field has been filled in
            if (submissionHasOneFieldEntry(values)) {
                const restResponse = await passToGravityForms(
                    singleForm.apiURL,
                    values,
                    lambda
                )

                setLoadingState(false)

                if (restResponse.status === 'error') {
                    // Handle the errors
                    // First check to make sure we have the correct data
                    if (doesObjectExist(restResponse.data)) {
                        // Validation errors passed back by Gravity Forms
                        if (restResponse.data.status === 'gravityFormErrors') {
                            // Pass messages to handle that sets react-hook-form errors
                            handleGravityFormsValidationErrors(
                                restResponse.data.validation_messages,
                                setError
                            )
                        }
                    } else {
                        console.log(restResponse)
                        // Seemed to be an unknown issue
                        setGeneralError('unknownError')
                    }
                }

                if (restResponse.status === 'success') {
                    setConfirmationMessage(
                        restResponse.data.data.confirmation_message
                    )
                }
            } else {
                setGeneralError('leastOneField')
            }
        }
    }

    if (!confirmationMessage) {
        return (
            singleForm && (
                <form
                    id={`gravityform--id-${id}`}
                    className={
                        formLoading
                            ? `gravityform gravityform--loading gravityform--id-${id}`
                            : `gravityform gravityform--id-${id}`
                    }
                    key={`gravityform--id-${id}`}
                    onSubmit={handleSubmit(onSubmitCallback)}
                >
                    {generalError && (
                        <FormGeneralError errorCode={generalError} />
                    )}

                    <FieldBuilder
                        formId={id}
                        formData={singleForm}
                        presetValues={presetValues}
                        reCaptchaKey={reCaptchaKey}
                        reCaptchaLoaded={reCaptchaLoaded}
                        register={register}
                        errors={errors}
                    />
                    <button type="submit" className="gravityform__button">
                        {singleForm.button.text
                            ? singleForm.button.text
                            : 'Submit'}{' '}
                        {formLoading && (
                            <span className="gravityform__button__loading_span">
                                Loading
                            </span>
                        )}
                    </button>
                </form>
            )
        )
    }

    return ReactHtmlParser(confirmationMessage)
}

export default GravityFormForm

GravityFormForm.defaultProps = {
    lambda: '',
}

GravityFormForm.propTypes = {
    reCaptchaKey: PropTypes.string.isRequired,
    reCaptchaLoaded: PropTypes.func.isRequired,
    formData: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired,
    lambda: PropTypes.string,
}
