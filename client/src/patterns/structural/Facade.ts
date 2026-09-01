import { User, UserRole } from '../../types';
import { api } from '../../services/api';
import { PatternTraceService } from '../../pattern-tracing/PatternTraceService';

export interface AuthSession {
  user: User;
  token: string;
  permissions: string[];
  activeRole: UserRole;
  loginTime: string;
  hospitalName: string;
}

// Subsystem 1: Credential Verification
class AuthService {
  async authenticate(email: string, role?: string): Promise<{ success: boolean; rawUser: any }> {
    PatternTraceService.emit({
      pattern: 'Facade',
      category: 'Structural',
      module: 'Authentication',
      step: 1,
      message: `AuthService: Validated credentials for ${email || role}`
    });
    const res = await api.login(email, role);
    return { success: res.success, rawUser: res.user };
  }
}

// Subsystem 2: Profile & Demographic Hydration
class ProfileService {
  hydrateProfile(rawUser: any): User {
    PatternTraceService.emit({
      pattern: 'Facade',
      category: 'Structural',
      module: 'Authentication',
      step: 2,
      message: `ProfileService: Hydrated clinical staff profile for "${rawUser.name}" (${rawUser.title})`
    });
    return {
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      role: rawUser.role,
      department: rawUser.department,
      avatar: rawUser.avatar,
      title: rawUser.title,
      permissions: rawUser.permissions || []
    };
  }
}

// Subsystem 3: Role & Capability Matrix Resolution
class RoleService {
  resolveRoleCapabilities(role: UserRole): { dashboardRoute: string; defaultDepartment: string } {
    PatternTraceService.emit({
      pattern: 'Facade',
      category: 'Structural',
      module: 'Authentication',
      step: 3,
      message: `RoleService: Resolved route capabilities for role "${role}"`
    });
    const routes: Record<UserRole, string> = {
      admin: '/admin',
      receptionist: '/reception',
      doctor: '/doctor',
      nurse: '/nurse',
      lab_tech: '/lab',
      pharmacist: '/pharmacy',
      billing_officer: '/billing'
    };
    return { dashboardRoute: routes[role] || '/admin', defaultDepartment: 'General' };
  }
}

// Subsystem 4: Permissions & Token Generation
class PermissionService {
  generateSessionToken(user: User): { token: string; permissions: string[] } {
    PatternTraceService.emit({
      pattern: 'Facade',
      category: 'Structural',
      module: 'Authentication',
      step: 4,
      message: `PermissionService: Generated JWT token and granted [${user.permissions.join(', ')}]`
    });
    return {
      token: `jwt_mediflow_${user.id}_${Date.now()}`,
      permissions: [...user.permissions]
    };
  }
}

// Facade Unifying all Subsystems
export class AuthFacade {
  private static authService = new AuthService();
  private static profileService = new ProfileService();
  private static roleService = new RoleService();
  private static permissionService = new PermissionService();

  public static async login(email: string, role?: string): Promise<AuthSession> {
    PatternTraceService.emit({
      pattern: 'Facade',
      category: 'Structural',
      module: 'Authentication',
      step: 0,
      message: `HospitalAuthFacade: Orchestrating unified login flow for ${email || role}`
    });

    // 1. Authenticate
    const authResult = await AuthFacade.authService.authenticate(email, role);
    if (!authResult.success || !authResult.rawUser) {
      throw new Error('Authentication failed.');
    }

    // 2. Hydrate Profile
    const user = AuthFacade.profileService.hydrateProfile(authResult.rawUser);

    // 3. Resolve Role Matrix
    AuthFacade.roleService.resolveRoleCapabilities(user.role);

    // 4. Resolve Permissions
    const sessionMeta = AuthFacade.permissionService.generateSessionToken(user);

    const session: AuthSession = {
      user,
      token: sessionMeta.token,
      permissions: sessionMeta.permissions,
      activeRole: user.role,
      loginTime: new Date().toISOString(),
      hospitalName: 'MediFlow Metropolitan Medical Center'
    };

    PatternTraceService.emit({
      pattern: 'Facade',
      category: 'Structural',
      module: 'Authentication',
      step: 5,
      message: `HospitalAuthFacade: Established active session for ${user.name} [${user.role}]`
    });

    return session;
  }
}
