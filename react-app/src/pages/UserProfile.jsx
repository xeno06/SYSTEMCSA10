import React, { useState } from 'react';
import '../dashboard.css'; // Importing global CSS for consistency (font, utility classes)

export default function UserProfile() {
    // Placeholder data (Replace with real auth data in production)
    const [user] = useState({
        name: "Admin User",
        email: "admin@cobuy-analytics.com",
        role: "Data Manager",
        department: "Operations",
        joinedDate: "January 2026",
        avatarLetter: "A",
        // Thematic color palette copied exactly from dashboard reference
        accents: {
            primary: '#22d3ee', // Cyan/Bright Teal
            secondary: '#c084fc', // Purple
            tertiary: '#fb7185' // Rose/Pink
        }
    });

    return (
        <div className="db-body" style={{ background: '#020617', minHeight: '100vh', padding: '24px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* ── PROFILE HEADER SECTION (Matching glass style) ── */}
                <div style={{
                    background: 'rgba(31, 41, 55, 0.5)', // Dark gray translucent
                    backdropFilter: 'blur(10px)', // Glass effect
                    padding: '30px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    marginBottom: '24px'
                }}>
                    {/* Multi-colored Profile Avatar (Glass Glow) */}
                    <div style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        // Cyan to Indigo gradient
                        background: 'linear-gradient(145deg, #22d3ee, #818cf8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        color: '#fff',
                        fontWeight: '800',
                        boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)' // Cyan glow
                    }}>
                        {user.avatarLetter}
                    </div>

                    <div>
                        <h1 style={{ color: '#fff', margin: 0, fontSize: '24px', fontWeight: '800' }}>{user.name}</h1>
                        <p style={{ color: '#22d3ee', margin: '3px 0', fontWeight: '600', letterSpacing: '1px', fontSize: '11px' }}>{user.role.toUpperCase()}</p>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <span style={{ fontSize: '13px', color: '#94a3b8' }}><i className="fas fa-envelope" style={{ marginRight: '6px' }}></i>{user.email}</span>
                            <span style={{ fontSize: '13px', color: '#94a3b8' }}><i className="fas fa-calendar-alt" style={{ marginRight: '6px' }}></i>Joined {user.joinedDate}</span>
                        </div>
                    </div>

                    <button className="file-btn" style={{ marginLeft: 'auto', padding: '10px 20px', background: '#0f172a' }}>
                        <i className="fas fa-edit" style={{ marginRight: '8px' }}></i> Edit Profile
                    </button>
                </div>

                {/* ── INFORMATION GRID (Matching dashboard card styling) ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>

                    {/* Column 1: Account Details (Cyan Accent) */}
                    <div className="db-card" style={{
                        background: '#0f172a',
                        padding: '24px',
                        borderRadius: '12px',
                        borderTop: `2px solid ${user.accents.primary}` // Replicating kpi card accent
                    }}>
                        <h4 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-id-card" style={{ color: user.accents.primary, opacity: 0.8 }}></i> Account Info
                        </h4>
                        {[
                            { label: "DEPARTMENT", value: user.department },
                            { label: "ACCOUNT ID", value: "CB-2026-991" },
                            { label: "LAST LOGIN", value: "Today, 10:45 AM" }
                        ].map((item, i) => (
                            <div key={i} style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800' }}>{item.label}</div>
                                <div style={{ fontSize: '14px', color: '#f1f5f9' }}>{item.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Column 2: Usage Statistics (Purple Accent) */}
                    <div className="db-card" style={{
                        background: '#0f172a',
                        padding: '24px',
                        borderRadius: '12px',
                        borderTop: `2px solid ${user.accents.secondary}` // Replicating kpi card accent
                    }}>
                        <h4 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-chart-pie" style={{ color: user.accents.secondary, opacity: 0.8 }}></i> Data Activity
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ background: 'rgba(34, 211, 238, 0.04)', padding: '15px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '24px', color: '#22d3ee', fontWeight: '800' }}>42</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Reports Made</div>
                            </div>
                            <div style={{ background: 'rgba(251, 113, 133, 0.04)', padding: '15px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '24px', color: '#fb7185', fontWeight: '800' }}>12</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Files Mined</div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Recent Logs (Rose Accent) */}
                    <div className="db-card" style={{
                        background: '#0f172a',
                        padding: '24px',
                        borderRadius: '12px',
                        borderTop: `2px solid ${user.accents.tertiary}` // Replicating kpi card accent
                    }}>
                        <h4 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-history" style={{ color: user.accents.tertiary, opacity: 0.8 }}></i> Recent Logs
                        </h4>
                        <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                            <div style={{ marginBottom: '10px' }}>• Updated <strong>Sales_March.xlsx</strong> <small style={{ color: '#64748b' }}>(2h ago)</small></div>
                            <div style={{ marginBottom: '10px' }}>• Generated <strong>Association Rules</strong> <small style={{ color: '#64748b' }}>(5h ago)</small></div>
                            <div>• Added new mining constraints <small style={{ color: '#64748b' }}>(Today)</small></div>
                        </div>
                    </div>
                </div>

                {/* ── SECURITY SETTINGS (Matching glass style) ── */}
                <div className="db-card" style={{
                    background: 'rgba(31, 41, 55, 0.5)', // Translucent glass background
                    backdropFilter: 'blur(10px)', // Glass blur
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.03)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h4 style={{ color: '#fff', margin: 0, fontWeight: '700' }}>Security Center</h4>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: '3px 0 0 0' }}>Manage password, authentication settings, and sign-out options.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="file-btn" style={{ padding: '8px 16px' }}>Update Password</button>
                            {/* Retained specific Red styling for destructive action from previous generations */}
                            <button style={{
                                background: '#f43f5e', // Solid Vibrant Red
                                color: '#fff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <i className="fas fa-sign-out-alt"></i> Sign Out
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}