/**
 * Created by bedeho on 22/11/2017.
 */

import React from 'react'
import PropTypes from 'prop-types'
import {
  ButtonSection,
  PrimaryButton,
  Subtitle
} from '../../../../components/Dialog'

// Styling generator
function getStyles(props) {

  return {
    root : {
      display : 'flex',
      flexDirection : 'column'
    },
    iconContainer : {
      display : 'flex',
      alignItems : 'center',
      justifyContent : 'center',
      height : '150px'
    },
    icon: {
      width : '90px',
      height : '90px'
    },
    message : {
      display : 'flex',
      flexDirection : 'column',
      alignItems : 'center',
      justifyContent : 'center',
      paddingBottom : '30px',
      paddingLeft : '60px',
      paddingRight : '60px',
      fontSize: '24px',
      fontFamily: 'Helvetica',
      textAlign: 'center',
      fontWeight: '100'
    }
  }
}

import SvgIcon from 'material-ui/SvgIcon'

const CompletedIcon = (props) => {

  return (
    <SvgIcon viewBox="0 0 64 64" style={props.style}>
      <polyline fill="none" stroke={props.strokeColor} strokeWidth="4" strokeLinecap="square" strokeMiterlimit="10" points=" 18,34 26,42 46,22 " strokeLinejoin="miter"></polyline>
      <circle fill="none" stroke={props.strokeColor} strokeWidth="4" strokeLinecap="square" strokeMiterlimit="10" cx="32" cy="32" r="30" strokeLinejoin="miter"></circle>
    </SvgIcon>
  )
}

const PaymentCompletedForm = (props) => {

  let styles = getStyles(props)

  return (
    <div style={styles.root}>

      <div style={styles.iconContainer}>
        <CompletedIcon style={styles.icon} strokeColor="#4CAF50"/>
      </div>

      <div style={styles.message}>
        <div>Payment made, and</div>
        <div>should be visible in the payment list.</div>
      </div>

      <ButtonSection>

        <PrimaryButton label="Ok"
                       onClick={props.onClick}
                       disabled={false}

        />

      </ButtonSection>

    </div>
  )

  // mhiAJ2EHEK2WG6ubNuCvwDwxdrzMZUftGb
}

PaymentCompletedForm.propTypes = {
  onClick : PropTypes.func.isRequired
}

export default PaymentCompletedForm