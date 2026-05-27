import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { UI_CONFIG } from '../../constants/config';
import { Button } from './Button';

export interface DialogModalProps {
  visible: boolean;
  title?: string;
  content?: string;
  onClose?: () => void;
  onConfirm?: () => void;
  disableBackdrop?: boolean;
}

export const DialogModal = ({
  visible,
  title = 'Dialog Title',
  content = 'Dialog content goes here...',
  onClose,
  onConfirm,
  disableBackdrop = false,
}: DialogModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={disableBackdrop ? undefined : onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.content}>{content}</Text>
              
              <View style={styles.actions}>
                <Button 
                  variant="secondary" 
                  text="Cancel" 
                  onPress={onClose} 
                  style={styles.button}
                />
                <Button 
                  variant="primary" 
                  text="Confirm" 
                  onPress={onConfirm} 
                  style={styles.button}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.spacing.lg,
  },
  container: {
    backgroundColor: UI_CONFIG.colors.surface,
    borderRadius: UI_CONFIG.borderRadius.lg,
    padding: UI_CONFIG.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: UI_CONFIG.typography.sizes.lg,
    fontWeight: UI_CONFIG.typography.weights.bold,
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  content: {
    fontSize: UI_CONFIG.typography.sizes.md,
    color: UI_CONFIG.colors.textSecondary,
    marginBottom: UI_CONFIG.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: UI_CONFIG.spacing.md,
  },
  button: {
    minWidth: 100,
  },
});
