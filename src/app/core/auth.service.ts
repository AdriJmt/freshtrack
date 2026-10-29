import { computed, Injectable, signal } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase.client';

import { setRememberMe } from './auth.storage';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signal pour stocker l'état de la session actuelle. Initialisé à null, ce signal sera mis à jour lorsque l'utilisateur se connecte ou se déconnecte.
  private readonly sessionState = signal<Session | null>(null);

  // Signal pour stocker l'état de l'utilisateur actuel. Initialisé à null, ce signal sera mis à jour lorsque l'utilisateur se connecte ou se déconnecte.
  private readonly userState = signal<User | null>(null);

  // Signal pour indiquer si le service d'authentification a été initialisé. Initialisé à false, ce signal sera mis à jour à true une fois que l'état de la session aura été déterminé.
  private readonly initializedState = signal(false);

  // Signaux en lecture seule pour exposer l'état de la session, de l'utilisateur et de l'initialisation aux composants qui consomment ce service.
  readonly session = this.sessionState.asReadonly();

  // Signaux en lecture seule pour exposer l'état de l'utilisateur actuel aux composants qui consomment ce service.
  readonly currentUser = this.userState.asReadonly();

  // Signaux en lecture seule pour indiquer si le service d'authentification a été initialisé.
  readonly isInitialized = this.initializedState.asReadonly();

  // Signal en lecture seule pour indiquer si un utilisateur est actuellement authentifié. Il est calculé en vérifiant si l'utilisateur actuel n'est pas null.
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    supabase.auth.onAuthStateChange((_event, session) => {
      this.updateSession(session);
      this.initializedState.set(true);
    });
  }

  /**
   * Inscrit un nouvel utilisateur en utilisant Supabase.
   * Met à jour l'état de la session et de l'utilisateur après l'inscription.
   * Si une erreur se produit lors de l'inscription, elle est levée pour être gérée par l'appelant.
   * @param {string} email - L'adresse e-mail de l'utilisateur à inscrire.
   * @param {string} password - Le mot de passe de l'utilisateur à inscrire.
   * @returns {Promise<User | null>} Une promesse qui se résout avec l'utilisateur inscrit ou null si l'inscription échoue.
   * @throws {Error} Si une erreur se produit lors de l'inscription.
   */
  async register(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    this.updateSession(data.session);

    return data.user;
  }

  /**
   * Connecte un utilisateur existant en utilisant Supabase.
   * Met à jour l'état de la session et de l'utilisateur après la connexion.
   * Si une erreur se produit lors de la connexion, elle est levée pour être gérée par l'appelant.
   * @param {string} email - L'adresse e-mail de l'utilisateur à connecter.
   * @param {string} password - Le mot de passe de l'utilisateur à connecter.
   * @param {boolean} remember - Indique si l'utilisateur souhaite rester connecté (true) ou non (false).
   * @returns {Promise<User>} Une promesse qui se résout avec l'utilisateur connecté.
   * @throws {Error} Si une erreur se produit lors de la connexion.
   */
  async login(
    email: string,
    password: string,
    remember: boolean,
  ): Promise<User> {
    setRememberMe(remember);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    this.updateSession(data.session);

    return data.user;
  }

  /**
   * Déconnecte l'utilisateur actuel en utilisant Supabase.
   * Met à jour l'état de la session et de l'utilisateur après la déconnexion.
   * Si une erreur se produit lors de la déconnexion, elle est levée pour être gérée par l'appelant.
   * @returns {Promise<void>} Une promesse qui se résout lorsque la déconnexion est terminée.
   * @throws {Error} Si une erreur se produit lors de la déconnexion.
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    this.updateSession(null);
  }

  /**
   * Met à jour l'état de la session et de l'utilisateur dans les signaux correspondants.
   * @param {Session | null} session - La nouvelle session à définir. Si null, cela signifie que l'utilisateur est déconnecté.
   */
  private updateSession(session: Session | null): void {
    this.sessionState.set(session);
    this.userState.set(session?.user ?? null);
  }
}
