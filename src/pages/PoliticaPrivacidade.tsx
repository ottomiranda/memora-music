import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

// Função utilitária para detectar se o idioma é português
const isPortugueseLanguage = (): boolean => {
  const language = navigator.language || navigator.languages?.[0] || 'en';
  return language.toLowerCase().startsWith('pt');
};

const PoliticaPrivacidade: React.FC = () => {
  const [isPortuguese, setIsPortuguese] = useState<boolean>(true);

  useEffect(() => {
    setIsPortuguese(isPortugueseLanguage());
  }, []);
  return (
    <>
      <Helmet>
        <title>{isPortuguese ? 'Política de Privacidade - Memora Music' : 'Privacy Policy - Memora Music'}</title>
        <meta name="description" content={isPortuguese ? 'Política de Privacidade da Memora Music - Como coletamos, utilizamos e protegemos seus dados pessoais' : 'Memora Music Privacy Policy - How we collect, use and protect your personal data'} />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
              {isPortuguese ? 'Política de Privacidade' : 'Privacy Policy'}
            </h1>
            
            <p className="text-gray-300 text-center mb-8">
              {isPortuguese ? 'Última atualização:' : 'Last updated:'} {new Date().toLocaleDateString(isPortuguese ? 'pt-BR' : 'en-US')}
            </p>
            
            <div className="text-gray-200 space-y-8">
              <p className="text-lg leading-relaxed">
                {isPortuguese 
                  ? 'A Memora Music by Twing valoriza a sua privacidade. Esta Política explica de forma clara como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais, incluindo dados de contas Google quando você escolhe utilizar o login com Google.'
                  : 'Memora Music by Twing values your privacy. This Policy clearly explains how we collect, use, store and protect your personal data, including Google account data when you choose to use Google login.'
                }
              </p>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {isPortuguese ? '1. Dados Coletados' : '1. Data Collected'}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      {isPortuguese ? '1.1 Dados fornecidos pelo usuário:' : '1.1 Data provided by the user:'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{isPortuguese ? 'Nome, e-mail e senha ao criar uma conta diretamente.' : 'Name, email and password when creating an account directly.'}</li>
                      <li>{isPortuguese ? 'Informações de briefing, preferências musicais e estilos escolhidos para gerar canções personalizadas.' : 'Briefing information, musical preferences and styles chosen to generate personalized songs.'}</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      {isPortuguese ? '1.2 Dados coletados via login com Google (Google OAuth):' : '1.2 Data collected via Google login (Google OAuth):'}
                    </h3>
                    <p className="mb-2">
                      {isPortuguese ? 'Quando você escolhe se registrar ou acessar sua conta com o Google, podemos acessar:' : 'When you choose to register or access your account with Google, we may access:'}
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{isPortuguese ? 'Nome e sobrenome.' : 'First and last name.'}</li>
                      <li>{isPortuguese ? 'Endereço de e-mail.' : 'Email address.'}</li>
                      <li>{isPortuguese ? 'Foto de perfil (se disponível).' : 'Profile picture (if available).'}</li>
                    </ul>
                    <p className="mt-2">
                      {isPortuguese ? 'Esses dados são usados apenas para autenticação e criação da conta Memora Music.' : 'This data is used only for authentication and creating your Memora Music account.'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      {isPortuguese ? '1.3 Dados de uso e técnicos:' : '1.3 Usage and technical data:'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>{isPortuguese ? 'Informações sobre interações com a plataforma (músicas criadas, versões escolhidas).' : 'Information about interactions with the platform (songs created, versions chosen).'}</li>
                      <li>{isPortuguese ? 'Dados técnicos como endereço IP, tipo de dispositivo, navegador e cookies.' : 'Technical data such as IP address, device type, browser and cookies.'}</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      {isPortuguese ? '1.4 Dados de pagamento:' : '1.4 Payment data:'}
                    </h3>
                    <p>
                      {isPortuguese ? 'Em caso de compras, os dados de pagamento são processados por parceiros (ex.: Stripe). A Memora Music não armazena informações completas de cartão.' : 'In case of purchases, payment data is processed by partners (e.g.: Stripe). Memora Music does not store complete card information.'}
                    </p>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {isPortuguese ? '2. Como Usamos os Dados' : '2. How We Use the Data'}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>{isPortuguese ? 'Autenticação e acesso:' : 'Authentication and access:'}</strong> {isPortuguese ? 'nome, e-mail e foto de perfil do Google são usados exclusivamente para autenticar sua conta.' : 'name, email and profile picture from Google are used exclusively to authenticate your account.'}</li>
                  <li><strong>{isPortuguese ? 'Personalização da experiência:' : 'Experience personalization:'}</strong> {isPortuguese ? 'usamos dados fornecidos no briefing para gerar canções personalizadas.' : 'we use data provided in the briefing to generate personalized songs.'}</li>
                  <li><strong>{isPortuguese ? 'Comunicação:' : 'Communication:'}</strong> {isPortuguese ? 'podemos enviar notificações sobre pedidos, atualizações e melhorias.' : 'we may send notifications about orders, updates and improvements.'}</li>
                  <li><strong>{isPortuguese ? 'Melhoria da plataforma:' : 'Platform improvement:'}</strong> {isPortuguese ? 'analisamos métricas de uso para aprimorar a experiência.' : 'we analyze usage metrics to enhance the experience.'}</li>
                  <li><strong>{isPortuguese ? 'Cumprimento legal:' : 'Legal compliance:'}</strong> {isPortuguese ? 'usamos dados quando necessário para cumprir leis aplicáveis.' : 'we use data when necessary to comply with applicable laws.'}</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {isPortuguese ? '3. Compartilhamento de Dados' : '3. Data Sharing'}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{isPortuguese ? 'Não vendemos nem alugamos dados pessoais a terceiros.' : 'We do not sell or rent personal data to third parties.'}</li>
                  <li>{isPortuguese ? 'Dados podem ser compartilhados com:' : 'Data may be shared with:'}
                    <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
                      <li>{isPortuguese ? 'Fornecedores de serviço (hospedagem, processamento de pagamento, suporte técnico).' : 'Service providers (hosting, payment processing, technical support).'}</li>
                      <li>{isPortuguese ? 'Parceiros de autenticação (Google, apenas para login seguro).' : 'Authentication partners (Google, only for secure login).'}</li>
                      <li>{isPortuguese ? 'Autoridades legais quando exigido por lei.' : 'Legal authorities when required by law.'}</li>
                    </ul>
                  </li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {isPortuguese ? '4. Armazenamento e Proteção de Dados' : '4. Data Storage and Protection'}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{isPortuguese ? 'Todos os dados são armazenados em servidores seguros em conformidade com LGPD (Brasil) e GDPR (Europa).' : 'All data is stored on secure servers in compliance with LGPD (Brazil) and GDPR (Europe).'}</li>
                  <li>{isPortuguese ? 'Implementamos medidas técnicas e organizacionais, incluindo criptografia em trânsito (TLS/SSL) e em repouso.' : 'We implement technical and organizational measures, including encryption in transit (TLS/SSL) and at rest.'}</li>
                  <li>{isPortuguese ? 'O acesso aos dados é restrito apenas a funcionários ou prestadores de serviço autorizados.' : 'Access to data is restricted only to authorized employees or service providers.'}</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {isPortuguese ? '5. Retenção e Exclusão de Dados' : '5. Data Retention and Deletion'}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{isPortuguese ? 'Dados de conta e músicas criadas são mantidos enquanto sua conta estiver ativa.' : 'Account data and created songs are kept while your account is active.'}</li>
                  <li>{isPortuguese ? 'Caso solicite exclusão, todos os seus dados pessoais (incluindo dados obtidos via login com Google) serão apagados permanentemente de nossos sistemas, salvo quando a retenção for necessária por obrigação legal.' : 'If you request deletion, all your personal data (including data obtained via Google login) will be permanently deleted from our systems, except when retention is necessary due to legal obligation.'}</li>
                  <li>{isPortuguese ? 'Para solicitar exclusão, entre em contato em:' : 'To request deletion, contact us at:'} <a href="mailto:contato@memora.music" className="text-blue-300 hover:text-blue-200 underline">contato@memora.music</a> {isPortuguese ? 'ou utilize a função "Excluir conta" na própria plataforma.' : 'or use the "Delete account" function on the platform itself.'}</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {isPortuguese ? '6. Direitos do Usuário' : '6. User Rights'}
                </h2>
                <p className="mb-2">
                  {isPortuguese ? 'Você pode, a qualquer momento:' : 'You can, at any time:'}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{isPortuguese ? 'Solicitar acesso, correção ou exclusão de seus dados.' : 'Request access, correction or deletion of your data.'}</li>
                  <li>{isPortuguese ? 'Retirar consentimento para determinados usos.' : 'Withdraw consent for certain uses.'}</li>
                  <li>{isPortuguese ? 'Solicitar a portabilidade dos dados.' : 'Request data portability.'}</li>
                  <li>{isPortuguese ? 'Opor-se ao tratamento em determinadas situações.' : 'Object to processing in certain situations.'}</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {isPortuguese ? '7. Cookies e Tecnologias' : '7. Cookies and Technologies'}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{isPortuguese ? 'Utilizamos cookies funcionais, analíticos e de preferência.' : 'We use functional, analytical and preference cookies.'}</li>
                  <li>{isPortuguese ? 'Você pode gerenciar cookies nas configurações do navegador ou em nosso banner de consentimento.' : 'You can manage cookies in browser settings or in our consent banner.'}</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {isPortuguese ? '8. Transferência Internacional de Dados' : '8. International Data Transfer'}
                </h2>
                <p>
                  {isPortuguese ? 'Seus dados podem ser processados fora do Brasil ou da União Europeia. Garantimos que qualquer transferência será feita de acordo com LGPD e GDPR, com salvaguardas adequadas.' : 'Your data may be processed outside Brazil or the European Union. We guarantee that any transfer will be made in accordance with LGPD and GDPR, with adequate safeguards.'}
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {isPortuguese ? '9. Alterações nesta Política' : '9. Changes to this Policy'}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{isPortuguese ? 'Esta política pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou na legislação.' : 'This policy may be updated periodically to reflect changes in our practices or legislation.'}</li>
                  <li>{isPortuguese ? 'Notificaremos sobre alterações significativas através do e-mail cadastrado ou aviso na plataforma.' : 'We will notify about significant changes through registered email or notice on the platform.'}</li>
                  <li>{isPortuguese ? 'A versão mais recente estará sempre disponível nesta página.' : 'The most recent version will always be available on this page.'}</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {isPortuguese ? '10. Contato' : '10. Contact'}
                </h2>
                <p className="mb-4">
                  {isPortuguese ? 'Para dúvidas, solicitações ou exercício de direitos relacionados aos seus dados pessoais:' : 'For questions, requests or exercise of rights related to your personal data:'}
                </p>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p><strong>E-mail:</strong> <a href="mailto:contato@memora.music" className="text-blue-300 hover:text-blue-200 underline">contato@memora.music</a></p>
                  <p><strong>{isPortuguese ? 'Responsável:' : 'Responsible:'}</strong> {isPortuguese ? 'Equipe Memora Music' : 'Memora Music Team'}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PoliticaPrivacidade;