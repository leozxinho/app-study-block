import { Modal } from '../ui/Modal';
import { AuthPanel } from './AuthPanel';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/** Janela de acesso: responsável (Google, e-mail, criar conta) ou criança (login e senha). */
export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Entrar no MineLearn">
      <AuthPanel onSuccess={onSuccess} />
    </Modal>
  );
}
