import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PoliticaDePrivacidade: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Botão de voltar */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar ao início
        </Link>

        {/* Conteúdo principal */}
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            Política de Privacidade – Memora Music
          </h1>
          
          <p className="text-white/80 text-center mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-white/90 text-lg leading-relaxed mb-8">
              A Memora Music by Twing valoriza a sua privacidade. Esta Política explica como coletamos, utilizamos e protegemos seus dados pessoais ao utilizar nossa plataforma.
            </p>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">1. Dados Coletados</h2>
              <p className="text-white/90 mb-4">Podemos coletar os seguintes dados:</p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Dados de cadastro: nome, e-mail, senha (ou login via Google).</li>
                <li>Dados de uso: interações na plataforma, músicas criadas, preferências de estilo e voz.</li>
                <li>Dados de pagamento: processados por parceiros (ex.: Stripe), sem armazenamento pela Memora Music.</li>
                <li>Dados técnicos: endereço IP, tipo de dispositivo, navegador e cookies para fins de desempenho e segurança.</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">2. Finalidade do Tratamento</h2>
              <p className="text-white/90 mb-4">Seus dados são utilizados para:</p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Criar e gerenciar sua conta.</li>
                <li>Permitir a geração de músicas personalizadas via inteligência artificial.</li>
                <li>Processar pagamentos de planos e serviços.</li>
                <li>Oferecer suporte e melhorar a experiência do usuário.</li>
                <li>Cumprir obrigações legais e regulatórias (LGPD/GDPR).</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">3. Base Legal para Tratamento</h2>
              <p className="text-white/90 mb-4">Tratamos seus dados pessoais com base em:</p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Execução de contrato (uso da plataforma).</li>
                <li>Consentimento (quando aplicável, ex.: envio de comunicações).</li>
                <li>Cumprimento de obrigação legal.</li>
                <li>Legítimo interesse (segurança, prevenção de fraudes, melhorias de serviço).</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">4. Compartilhamento de Dados</h2>
              <p className="text-white/90 mb-4">Podemos compartilhar dados com:</p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Fornecedores de serviços (hospedagem, processamento de pagamentos, suporte técnico).</li>
                <li>Parceiros de marketing (apenas mediante consentimento).</li>
                <li>Autoridades legais (quando exigido por lei).</li>
              </ul>
              <p className="text-white/90 mt-4">Não vendemos nem alugamos dados pessoais a terceiros.</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">5. Retenção de Dados</h2>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Manteremos seus dados pessoais enquanto sua conta estiver ativa.</li>
                <li>Após exclusão da conta, os dados serão apagados ou anonimizados, salvo quando houver necessidade legal de retenção.</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">6. Direitos do Usuário</h2>
              <p className="text-white/90 mb-4">Você pode, a qualquer momento:</p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Solicitar acesso, correção ou exclusão de seus dados.</li>
                <li>Retirar seu consentimento.</li>
                <li>Solicitar a portabilidade de dados.</li>
                <li>Opor-se ao tratamento em determinadas situações.</li>
              </ul>
              <p className="text-white/90 mt-4">
                Entre em contato pelo e-mail <a href="mailto:suporte@memora.music" className="text-purple-300 hover:text-purple-200 underline">suporte@memora.music</a> para exercer seus direitos.
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">7. Segurança</h2>
              <p className="text-white/90">
                Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição. Nenhum sistema é 100% seguro, mas seguimos as melhores práticas de mercado.
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">8. Cookies e Tecnologias de Rastreamento</h2>
              <p className="text-white/90 mb-4">Utilizamos cookies para:</p>
              <ul className="list-disc list-inside text-white/90 space-y-2 ml-4">
                <li>Garantir o funcionamento do site.</li>
                <li>Melhorar a experiência de navegação.</li>
                <li>Coletar métricas de desempenho e uso.</li>
              </ul>
              <p className="text-white/90 mt-4">Você pode gerenciar cookies nas configurações do navegador.</p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">9. Transferência Internacional de Dados</h2>
              <p className="text-white/90">
                Seus dados podem ser processados fora do Brasil ou da União Europeia, sempre em conformidade com LGPD e GDPR, garantindo níveis adequados de proteção.
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">10. Alterações na Política</h2>
              <p className="text-white/90">
                Esta Política pode ser atualizada periodicamente. A versão mais recente estará sempre disponível no site da Memora Music.
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">11. Contato</h2>
              <p className="text-white/90">
                Para dúvidas ou solicitações sobre privacidade, entre em contato:
              </p>
              <p className="text-white/90 mt-2">
                📩 <a href="mailto:suporte@memora.music" className="text-purple-300 hover:text-purple-200 underline">suporte@memora.music</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDePrivacidade;