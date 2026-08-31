import { createContext, useContext, useEffect, useState } from 'react';

const KEY = 'miwallet_lang';

// Diccionarios de traducción. Nombra las claves y añádele la misma clave en EN/ES.
const messages = {
  es: {
    // App / común
    appName: 'Mi Wallet',
    tagline: 'Tarjetas de fidelización digitales',
    back: 'Volver',
    logout: 'Salir',
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    walletCount: 'tarjeta(s)',

    // Home
    homeClient: 'Mi Wallet (Cliente)',
    homeEmployee: 'Empleado',
    homeAdmin: 'Administrador',
    homeSubtitle: 'Selecciona tu acceso',

    // Idioma
    language: 'Idioma',
    langEs: 'Español',
    langEn: 'English',

    // Login compartido
    email: 'Correo electrónico',
    password: 'Contraseña',
    fullName: 'Nombre completo',
    login: 'Ingresar',
    loggingIn: 'Entrando...',
    checkFields: 'Revisa los campos marcados',

    // Admin
    adminTitle: 'Acceso administrador',
    adminSub: 'Gestiona tu negocio y tarjetas',
    adminRegister: '¿No tienes cuenta? Regístrate',
    adminRegisterTitle: 'Crear cuenta',
    adminRegisterSub: 'Administrador del negocio',
    createAccount: 'Crear cuenta',
    creatingAccount: 'Creando...',
    adminPanel: 'Panel Admin',
    adminPanelSub: 'Administración de tu negocio',
    tabBusiness: 'Negocio',
    tabCards: 'Tarjetas',
    tabEmployees: 'Empleados',

    // Errores
    errorConnect: 'No se pudo conectar con el servidor. ¿Está encendido el backend?',
    errorCredentials: 'Credenciales inválidas',
    errorEmailTaken: 'Ya existe una cuenta con ese email',
    errorGeneric: 'Ocurrió un error',

    // Empleado
    employeeTitle: 'Acceso empleado',
    employeeSub: 'Inicia sesión para registrar sellos',
  },
  en: {
    appName: 'My Wallet',
    tagline: 'Digital loyalty cards',
    back: 'Back',
    logout: 'Log out',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    walletCount: 'card(s)',

    homeClient: 'My Wallet (Customer)',
    homeEmployee: 'Employee',
    homeAdmin: 'Administrator',
    homeSubtitle: 'Choose your access',

    language: 'Language',
    langEs: 'Español',
    langEn: 'English',

    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    login: 'Sign in',
    loggingIn: 'Signing in...',
    checkFields: 'Check the highlighted fields',

    adminTitle: 'Administrator access',
    adminSub: 'Manage your business and cards',
    adminRegister: "Don't have an account? Register",
    adminRegisterTitle: 'Create account',
    adminRegisterSub: 'Business administrator',
    createAccount: 'Create account',
    creatingAccount: 'Creating...',
    adminPanel: 'Admin Panel',
    adminPanelSub: 'Manage your business',
    tabBusiness: 'Business',
    tabCards: 'Cards',
    tabEmployees: 'Employees',

    errorConnect: 'Could not connect to the server. Is the backend running?',
    errorCredentials: 'Invalid credentials',
    errorEmailTaken: 'An account with that email already exists',
    errorGeneric: 'Something went wrong',

    employeeTitle: 'Employee access',
    employeeSub: 'Sign in to register stamps',
  },
};

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(KEY) || 'es';
    } catch {
      return 'es';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang);
    } catch {}
  }, [lang]);

  const t = (key) => (messages[lang]?.[key] ?? messages.es[key] ?? key);

  const value = { lang, setLang, t };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang debe usarse dentro de <LanguageProvider>');
  return ctx;
}