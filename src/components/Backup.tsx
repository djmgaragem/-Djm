import React, { useRef, useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  HelpCircle,
  FileCode,
  AlertOctagon,
  Info
} from 'lucide-react';

interface BackupProps {
  onImportData: (jsonData: string) => boolean;
  onExportData: () => void;
  onResetData: () => void;
}

export default function Backup({
  onImportData,
  onExportData,
  onResetData
}: BackupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        // Basic schema verification
        if (parsed.clients && parsed.products && parsed.services && parsed.patio && parsed.orders && parsed.transactions) {
          const success = onImportData(text);
          if (success) {
            setImportStatus('success');
            setErrorMessage('');
            alert('Dados restaurados com sucesso! O sistema foi atualizado.');
          } else {
            throw new Error('Falha ao gravar dados no armazenamento.');
          }
        } else {
          throw new Error('O arquivo selecionado não possui um formato de backup válido do Oficina360.');
        }
      } catch (err: any) {
        setImportStatus('error');
        setErrorMessage(err.message || 'Erro ao importar arquivo.');
        alert(`Erro na Importação: ${err.message || 'Formato de arquivo inválido.'}`);
      }
    };
    reader.readAsText(file);
    
    // Clear the input value so user can upload the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-blue-600" />
          Salvamento, Backup e Sincronização
        </h1>
        <p className="text-slate-500 text-sm">Transfira seus dados facilmente entre o PC, celular ou tablet exportando/importando backups.</p>
      </div>

      {/* Info message */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs sm:text-sm text-blue-800 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Como funciona a sincronização e salvamento?</p>
          <p className="leading-relaxed text-blue-700">
            Todos os seus cadastros, pátio, orçamentos, estoque e fluxo de caixa são <strong>salvos automaticamente em tempo real</strong> no navegador deste aparelho. 
            Se você quiser usar o sistema em outro aparelho (como sair do PC para o celular), basta clicar em <strong>Exportar Backup</strong>, enviar o arquivo gerado para o outro aparelho e clicar em <strong>Importar Backup</strong>!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-block">
              <Download className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Exportar Meus Dados</h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Baixe um arquivo criptografado contendo todo o banco de dados da sua oficina para seu computador, celular ou tablet. Guarde como cópia de segurança.
            </p>
          </div>

          <button
            onClick={onExportData}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
          >
            <Download className="h-4.5 w-4.5" />
            Baixar Backup Geral (.json)
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl inline-block">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Restaurar / Importar Backup</h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Carregue um arquivo de backup (.json) exportado anteriormente. Isso substituirá as informações atuais pelas informações do backup.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={triggerFileInput}
              className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
            >
              <Upload className="h-4.5 w-4.5" />
              Selecionar e Restaurar Backup
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-rose-800 text-base flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-rose-600" />
          Zona de Perigo
        </h3>
        <p className="text-rose-700 text-xs sm:text-sm leading-relaxed">
          As ações abaixo são irreversíveis. Ao restaurar os dados de fábrica, você apagará permanentemente todos os clientes, veículos, pátio e transações financeiras registrados neste aparelho e recarregará o banco de dados demonstrativo.
        </p>

        <button
          onClick={() => {
            if (confirm('ATENÇÃO: Deseja realmente APAGAR todos os seus dados e reiniciar o sistema com os dados de fábrica? Essa ação não pode ser desfeita.')) {
              onResetData();
              alert('O sistema foi limpo e os dados demonstrativos foram recarregados.');
            }
          }}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          Limpar Tudo e Resetar Sistema
        </button>
      </div>
    </div>
  );
}
