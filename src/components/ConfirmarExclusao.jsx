import { useState } from 'react'
import Modal from './Modal'
import { traduzirErro } from '../lib/erros'

// Janela "Tem certeza?" para exclusões.
// aoConfirmar deve ser uma função assíncrona que apaga o registro.
export default function ConfirmarExclusao({ titulo, mensagem, aoConfirmar, aoCancelar }) {
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState('')

  async function confirmar() {
    setExcluindo(true)
    setErro('')
    try {
      await aoConfirmar()
    } catch (e) {
      setErro(traduzirErro(e))
      setExcluindo(false)
    }
  }

  return (
    <Modal titulo={titulo} aoFechar={excluindo ? () => {} : aoCancelar}>
      <p className="texto-confirmacao">{mensagem}</p>

      {erro && (
        <div className="aviso aviso-erro" role="alert">
          {erro}
        </div>
      )}

      <div className="acoes-formulario">
        <button type="button" className="botao botao-secundario" onClick={aoCancelar} disabled={excluindo}>
          Cancelar
        </button>
        <button type="button" className="botao botao-perigo" onClick={confirmar} disabled={excluindo}>
          {excluindo ? 'Excluindo…' : 'Excluir'}
        </button>
      </div>
    </Modal>
  )
}
