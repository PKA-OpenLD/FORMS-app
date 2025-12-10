/*
 * Copyright 2025 PKA-OpenLD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NextRequest, NextResponse } from 'next/server';
import { voteOnReport, getReportById, updateReport, removeVote } from '@/lib/db/user-reports';
import { createZone } from '@/lib/db/zones';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { reportId, voteType } = await request.json();

    if (!reportId || !['up', 'down', 'remove'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    let result;
    if (voteType === 'remove') {
      result = await removeVote(reportId, user.id);
    } else {
      result = await voteOnReport(reportId, user.id, voteType);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Auto-create zone if report reaches 3+ upvotes OR is admin approved
    if (result.voteScore >= 3) {
      const report = await getReportById(reportId);
      if (report && !report.zoneCreated && !report.adminApproved) {
        try {
          // Create zone from report
          const zoneData = {
            id: `zone-auto-${Date.now()}`,
            type: report.type === 'flood' ? 'flood' as const : 'outage' as const,
            shape: report.coordinates && report.coordinates.length > 1 ? 'line' as const : 'circle' as const,
            center: report.location,
            coordinates: report.coordinates,
            radius: 500, // 500m radius for circle zones
            riskLevel: report.severity === 'high' ? 9 : report.severity === 'medium' ? 6 : 4,
            title: `🔥 Khu vực phổ biến: ${report.description.substring(0, 50)}`,
            description: `Tự động tạo từ báo cáo có ${result.voteScore} upvotes`
          };

          await createZone(zoneData);

          // Mark report as having created a zone
          await updateReport(reportId, { zoneCreated: true });

          // TODO: Send notifications to nearby users via WebSocket
          // This should be handled through the WebSocket server
        } catch (error) {
          console.error('Failed to auto-create zone:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      voteScore: result.voteScore,
      zoneCreated: result.voteScore >= 3
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
}
