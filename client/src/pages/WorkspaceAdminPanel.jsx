import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Button, Space, Popconfirm, List, Typography, message, Divider, Tag } from 'antd';
import { TeamOutlined, ProfileOutlined, FileTextOutlined, FileOutlined, MessageOutlined, DeleteOutlined, UserOutlined, CrownOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Text, Title } = Typography;

const WorkspaceAdminPanel = ({ roomId, currentUserId, onRefreshMembers, onRefreshMessages, onRefreshFiles, messages, files }) => {
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Find caller's role in this workspace
  const currentUserMember = members.find(m => m.user_id === currentUserId);
  const currentUserRole = currentUserMember?.role || 'member';

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get(`/rooms/${roomId}/admin/stats`);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
      message.error('Failed to load workspace statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await api.get(`/rooms/${roomId}/admin/members`);
      if (res.data.success) {
        setMembers(res.data.data.members);
      }
    } catch (err) {
      console.error(err);
      message.error('Failed to load workspace members');
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await api.put(`/rooms/${roomId}/admin/members/${targetUserId}/role`, { role: newRole });
      if (res.data.success) {
        message.success('Member role updated successfully');
        fetchMembers();
        if (onRefreshMembers) onRefreshMembers();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update member role';
      message.error(errMsg);
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    try {
      const res = await api.delete(`/rooms/${roomId}/admin/members/${targetUserId}`);
      if (res.data.success) {
        message.success('Member removed from workspace');
        fetchMembers();
        fetchStats();
        if (onRefreshMembers) onRefreshMembers();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to remove member';
      message.error(errMsg);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await api.delete(`/rooms/${roomId}/admin/messages/${messageId}`);
      if (res.data.success) {
        message.success('Message deleted successfully');
        fetchStats();
        if (onRefreshMessages) onRefreshMessages();
      }
    } catch (err) {
      message.error('Failed to delete message');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const res = await api.delete(`/rooms/${roomId}/admin/files/${fileId}`);
      if (res.data.success) {
        message.success('File deleted successfully');
        fetchStats();
        if (onRefreshFiles) onRefreshFiles();
      }
    } catch (err) {
      message.error('Failed to delete file');
    }
  };

  // Check action permissions for RBAC hierarchy
  const canManageMember = (targetUser) => {
    if (targetUser.user_id === currentUserId) return false; // Cannot manage self
    if (targetUser.role === 'owner') return false; // Owner is untouchable

    if (currentUserRole === 'owner') {
      return true; // Owner can manage anyone else (admin & member)
    }

    if (currentUserRole === 'admin') {
      // Admins can only manage members, not other admins
      return targetUser.role === 'member';
    }

    return false;
  };

  const renderRoleTag = (role) => {
    switch (role) {
      case 'owner':
        return <Tag color="gold" icon={<CrownOutlined />}>Owner</Tag>;
      case 'admin':
        return <Tag color="blue" icon={<SafetyCertificateOutlined />}>Admin</Tag>;
      default:
        return <Tag color="gray" icon={<UserOutlined />}>Member</Tag>;
    }
  };

  const memberColumns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text, record) => (
        <Space>
          <Text style={{ fontWeight: 600 }}>{text}</Text>
          {record.user_id === currentUserId && <Tag color="cyan">You</Tag>}
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => {
        const manageable = canManageMember(record);
        if (manageable) {
          return (
            <Select
              value={role}
              onChange={(value) => handleRoleChange(record.user_id, value)}
              style={{ width: 120 }}
              size="small"
            >
              <Select.Option value="member">Member</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          );
        }
        return renderRoleTag(role);
      }
    },
    {
      title: 'Joined At',
      dataIndex: 'joined_at',
      key: 'joined_at',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const manageable = canManageMember(record);
        return manageable ? (
          <Popconfirm
            title="Are you sure you want to remove this member from the workspace?"
            onConfirm={() => handleRemoveMember(record.user_id)}
            okText="Remove"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small">Remove</Button>
          </Popconfirm>
        ) : null;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <Title level={4} style={{ marginBottom: 20 }}>Role-Based Workspace Administration</Title>
      
      {/* Metrics Row */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={4}>
          <Card loading={loadingStats} bordered={false} className="shadow-sm">
            <Statistic title="Members" value={stats?.totalMembers || 0} prefix={<TeamOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card loading={loadingStats} bordered={false} className="shadow-sm">
            <Statistic title="Tasks" value={stats?.totalTasks || 0} prefix={<ProfileOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card loading={loadingStats} bordered={false} className="shadow-sm">
            <Statistic title="Notes" value={stats?.totalNotes || 0} prefix={<FileTextOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card loading={loadingStats} bordered={false} className="shadow-sm">
            <Statistic title="Shared Files" value={stats?.totalFiles || 0} prefix={<FileOutlined style={{ color: '#ff4d4f' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card loading={loadingStats} bordered={false} className="shadow-sm">
            <Statistic title="Messages" value={stats?.totalMessages || 0} prefix={<MessageOutlined style={{ color: '#722ed1' }} />} />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Member Management Table */}
      <Card title="Workspace Members" bordered={false} className="shadow-sm">
        <Table
          dataSource={members}
          columns={memberColumns}
          rowKey="user_id"
          loading={loadingMembers}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Divider />

      {/* Moderation Controls */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Recent Messages Moderation" bordered={false} className="shadow-sm" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <List
              dataSource={messages ? [...messages].reverse().slice(0, 15) : []}
              renderItem={(msg) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="Delete this message?"
                      onConfirm={() => handleDeleteMessage(msg.id)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text style={{ fontWeight: 600 }}>{msg.full_name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{new Date(msg.created_at).toLocaleTimeString()}</Text>
                      </Space>
                    }
                    description={msg.content}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Shared Files Moderation" bordered={false} className="shadow-sm" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <List
              dataSource={files || []}
              renderItem={(file) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="Delete this file?"
                      onConfirm={() => handleDeleteFile(file.id)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={<Text style={{ fontWeight: 600 }}>{file.file_name}</Text>}
                    description={`Shared by: ${file.uploader_name || 'System'}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WorkspaceAdminPanel;
