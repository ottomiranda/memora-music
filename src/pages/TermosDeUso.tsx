import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermosDeUso: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header com botão de volta */}
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            Termos de Uso – Memora Music
          </h1>
          
          <p className="text-white/80 text-center mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <div className="prose prose-invert max-w-none">
            <p className="text-white/90 text-lg leading-relaxed mb-8">
              Bem-vindo à Memora Music by Twing. Ao acessar e utilizar nossa plataforma, você concorda com os presentes Termos de Uso. Por favor, leia-os com atenção antes de utilizar nossos serviços.
            </p>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">1. Objeto</h2>
              <p className="text-white/90 leading-relaxed">
                A Memora Music oferece uma plataforma digital baseada em inteligência artificial que permite a criação de músicas personalizadas a partir de informações fornecidas pelo usuário (briefing). O usuário pode gerar letras, melodias e versões finais em formato digital (MP3).
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">2. Aceitação dos Termos</h2>
              <p className="text-white/90 leading-relaxed">
                O uso da plataforma implica na aceitação plena e irrevogável destes Termos de Uso, bem como de nossa Política de Privacidade. Caso não concorde, recomendamos não utilizar o serviço.
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">3. Cadastro e Conta</h2>
              <ul className="text-white/90 leading-relaxed space-y-2">
                <li>• Para acessar determinadas funcionalidades (como salvar músicas), é necessário criar uma conta utilizando e-mail ou login via Google.</li>
                <li>• O usuário é responsável por manter a confidencialidade de suas credenciais de acesso.</li>
                <li>• É proibido compartilhar credenciais ou utilizar contas de terceiros.</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">4. Uso da Plataforma</h2>
              <ul className="text-white/90 leading-relaxed space-y-2">
                <li>• O usuário deve fornecer informações verdadeiras e de boa-fé no briefing para gerar sua música.</li>
                <li>• É proibido utilizar a plataforma para conteúdos ilegais, ofensivos, discriminatórios ou que infrinjam direitos de terceiros.</li>
                <li>• O conteúdo gerado (músicas, letras e melodias) é de uso pessoal e não comercial, salvo mediante autorização prévia e escrita da Memora Music.</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">5. Licenciamento do Conteúdo Gerado</h2>
              <ul className="text-white/90 leading-relaxed space-y-2">
                <li>• A Memora Music concede ao usuário uma licença não exclusiva, pessoal e intransferível para uso das músicas criadas como presente ou lembrança pessoal.</li>
                <li>• É vedada a exploração comercial, revenda, distribuição em massa ou uso profissional sem contrato específico com a Memora Music.</li>
                <li>• A Memora Music pode utilizar versões de músicas geradas de forma anonimizada para fins de teste, melhoria e promoção da plataforma, respeitando a privacidade do usuário.</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">6. Direitos Autorais e Vozes Sintéticas</h2>
              <ul className="text-white/90 leading-relaxed space-y-2">
                <li>• As músicas criadas utilizam inteligência artificial e vozes sintéticas licenciadas.</li>
                <li>• Não há associação com artistas reais, sendo proibido alegar autoria de terceiros.</li>
                <li>• O usuário reconhece que, por se tratar de tecnologia de IA, pequenas variações ou limitações criativas podem ocorrer.</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">7. Pagamentos e Planos</h2>
              <ul className="text-white/90 leading-relaxed space-y-2">
                <li>• A primeira música gerada é gratuita.</li>
                <li>• Músicas adicionais estarão disponíveis mediante pagamento, conforme valores divulgados na plataforma.</li>
                <li>• Pagamentos são processados por parceiros terceiros (ex.: Stripe). A Memora Music não armazena dados de cartão.</li>
                <li>• Não há reembolso após a entrega da música final, exceto em casos de falha técnica comprovada.</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">8. Responsabilidades</h2>
              <ul className="text-white/90 leading-relaxed space-y-2">
                <li>• A Memora Music não se responsabiliza por uso indevido dos conteúdos gerados pelo usuário.</li>
                <li>• A plataforma pode passar por atualizações, manutenção ou interrupções temporárias.</li>
                <li>• O usuário é responsável por garantir que possui os direitos de usar qualquer material (textos, nomes, mensagens) inserido no briefing.</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">9. Privacidade e Dados</h2>
              <ul className="text-white/90 leading-relaxed space-y-2">
                <li>• A coleta e o tratamento de dados pessoais seguem a nossa Política de Privacidade, em conformidade com a LGPD (Brasil) e GDPR (Europa).</li>
                <li>• O usuário pode solicitar a exclusão de sua conta e dados pessoais a qualquer momento.</li>
              </ul>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">10. Alterações nos Termos</h2>
              <p className="text-white/90 leading-relaxed">
                A Memora Music reserva-se o direito de alterar estes Termos a qualquer momento, publicando a versão atualizada em seu website. O uso contínuo da plataforma implica na aceitação das novas condições.
              </p>
            </section>

            <div className="border-t border-white/20 my-8"></div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">11. Contato</h2>
              <p className="text-white/90 leading-relaxed">
                Em caso de dúvidas ou solicitações relacionadas a estes Termos de Uso, entre em contato pelo e-mail: 
                <a href="mailto:suporte@memora.music" className="text-purple-300 hover:text-purple-200 underline">
                  suporte@memora.music
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermosDeUso;