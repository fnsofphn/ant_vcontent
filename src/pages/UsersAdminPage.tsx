import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Badge, Card, SectionHeader } from '@/components/ui/Primitives';
import {
  adminCreateAuthUser,
  adminResetAuthPassword,
  createProfile,
  listCompanies,
  listOrganizations,
  listProfiles,
} from '@/services/vcontent';

export function UsersAdminPage() {
  const { profile, session } = useAuth();
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
  });
  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: listOrganizations,
  });
  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: listCompanies,
  });
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('client');
  const [organizationId, setOrganizationId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [accessScope, setAccessScope] = useState('self');
  const [createAuthNow, setCreateAuthNow] = useState(true);
  const [password, setPassword] = useState('Welcome@123');
  const [createFeedback, setCreateFeedback] = useState('');

  const createProfileMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
  const createAuthMutation = useMutation({
    mutationFn: adminCreateAuthUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
  const resetPasswordMutation = useMutation({
    mutationFn: adminResetAuthPassword,
  });

  const handleCreateUser = async () => {
    setCreateFeedback('');
    if (!session?.access_token) {
      setCreateFeedback('Thiếu access token.');
      return;
    }

    try {
      const profileId = await createProfileMutation.mutateAsync({
        fullName,
        email,
        role,
        organizationId: organizationId || null,
        companyId: companyId || null,
        title: title || null,
        accessScope,
      });

      if (createAuthNow) {
        await createAuthMutation.mutateAsync({
          accessToken: session.access_token,
          email,
          password,
          fullName,
          profileId,
        });
      }

      setFullName('');
      setEmail('');
      setRole('client');
      setOrganizationId('');
      setCompanyId('');
      setTitle('');
      setAccessScope('self');
      setCreateAuthNow(true);
      setPassword('Welcome@123');
      setCreateFeedback(createAuthNow ? 'Đã tạo profile và tài khoản Auth.' : 'Đã tạo profile.');
    } catch (error) {
      setCreateFeedback(String(error instanceof Error ? error.message : error));
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <>
        <SectionHeader
          eye="Hệ thống"
          title="Người dùng & Phân quyền"
          subtitle="Màn quản trị đầy đủ chỉ mở cho Admin."
        />
        <Card title="Danh sach nguoi dung">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ten</th>
                <th>Email</th>
                <th>Role</th>
                <th>Don vi</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {(usersQuery.data || []).map((item: any) => (
                <tr key={item.id}>
                  <td>{item.full_name}</td>
                  <td>{item.email || '-'}</td>
                  <td>{item.role}</td>
                  <td>{item.company_id || item.organization_id || '-'}</td>
                  <td>{item.active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </>
    );
  }

  return (
    <>
      <SectionHeader
        eye="Hệ thống"
        title="Người dùng & Phân quyền"
        subtitle="CRUD profile tren Supabase, kem tao Auth user va reset password bang server function."
      />
      <div className="content-grid two-column">
        <Card title="Tạo người dùng mới">
          <div className="form-grid">
            <label>
              <span>Họ tên</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nguyễn Văn A" />
            </label>
            <label>
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@company.vn" />
            </label>
            <label>
              <span>Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="admin">Admin</option>
                <option value="pm">PM</option>
                <option value="specialist">Specialist</option>
                <option value="qc">QC</option>
                <option value="client">Client</option>
                <option value="client_director">Client Director</option>
              </select>
            </label>
            <label>
              <span>Access scope</span>
              <select value={accessScope} onChange={(event) => setAccessScope(event.target.value)}>
                <option value="all">all</option>
                <option value="organization">organization</option>
                <option value="company">company</option>
                <option value="self">self</option>
              </select>
            </label>
            <label>
              <span>Tổ chức</span>
              <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
                <option value="">-- Chọn --</option>
                {(organizationsQuery.data || []).map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Công ty</span>
              <select value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
                <option value="">-- Chọn --</option>
                {(companiesQuery.data || [])
                  .filter((item: any) => !organizationId || item.organization_id === organizationId)
                  .map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>Chức danh</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Project Manager" />
            </label>
            <label>
              <span>Mật khẩu đầu</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label className="full">
              <span>Khởi tạo đăng nhập</span>
              <select value={createAuthNow ? 'yes' : 'no'} onChange={(event) => setCreateAuthNow(event.target.value === 'yes')}>
                <option value="yes">Tạo luôn tài khoản Auth</option>
                <option value="no">Chỉ tạo profile</option>
              </select>
            </label>
            <div className="action-row">
              <button className="btn btn-danger" onClick={() => void handleCreateUser()} disabled={!fullName || !email || createProfileMutation.isPending || createAuthMutation.isPending}>
                {createProfileMutation.isPending || createAuthMutation.isPending ? 'Đang tạo...' : 'Tạo người dùng'}
              </button>
            </div>
            {createFeedback ? <div className="muted-text">{createFeedback}</div> : null}
          </div>
        </Card>
        <Card title="Danh sách hiện có">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ten</th>
                <th>Email</th>
                <th>Role</th>
                <th>Scope</th>
                <th>Auth</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(usersQuery.data || []).map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <div className="fw6">{item.full_name}</div>
                    <div className="muted-text">{item.title || '-'}</div>
                  </td>
                  <td>{item.email || '-'}</td>
                  <td>{item.role}</td>
                  <td>{item.access_scope}</td>
                  <td>{item.auth_user_id ? <Badge tone="success">linked</Badge> : <Badge tone="warning">profile-only</Badge>}</td>
                  <td>
                    {item.auth_user_id ? (
                      <button
                        className="btn btn-ghost btn-small"
                        onClick={() => {
                          const nextPassword = window.prompt(`Mật khẩu mới cho ${item.email || item.full_name}`, 'Welcome@123');
                          if (!nextPassword || !session?.access_token) return;
                          resetPasswordMutation.mutate({
                            accessToken: session.access_token,
                            userId: item.auth_user_id,
                            password: nextPassword,
                          });
                        }}
                      >
                        Reset password
                      </button>
                    ) : (
                      <button
                        className="btn btn-ghost btn-small"
                        onClick={() => {
                          if (!session?.access_token || !item.email) return;
                          createAuthMutation.mutate({
                            accessToken: session.access_token,
                            email: item.email,
                            password: 'Welcome@123',
                            fullName: item.full_name,
                            profileId: item.id,
                          });
                        }}
                      >
                        Tạo auth
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resetPasswordMutation.error ? <div className="muted-text">{String(resetPasswordMutation.error)}</div> : null}
        </Card>
      </div>
    </>
  );
}
