/*
PING INTEGRATION
A recursive JSON search algorithm.
Originally written by shakhal in classic JS.
Refactored to ES6 by...

@see https://blog.bitsrc.io/how-to-implement-idle-timeout-in-react-830d21c32942
@see https://www.npmjs.com/package/react-idle-timer
*/

import React from 'react';
import { Modal } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

export const IdleTimeOutModal = ({ showModal, handleClose, handleLogout, remainingTime }) => {
    return (
        <Modal show={showModal} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Are you still there?</Modal.Title>
            </Modal.Header>
            <Modal.Body>Your session will end shortly. What would you like to do?</Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={handleLogout}>
                    Logout
            </Button>
                <Button variant="primary" onClick={handleClose}>
                    Stay
            </Button>
            </Modal.Footer>
        </Modal>
    )
}