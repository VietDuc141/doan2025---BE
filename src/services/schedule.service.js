const Plan = require('../models/Plan');

class ScheduleService {
    constructor() {
        this.scheduleMap = new Map(); // Store active schedule intervals
        console.log('ScheduleService initialized');
    }

    // Khởi tạo schedule cho một plan
    async initializePlanSchedule(planId) {
        try {
            console.log(`[Schedule] Initializing schedule for plan ${planId}`);
            const plan = await Plan.findById(planId).populate('campaigns.campaign');
            if (!plan) {
                console.log(`[Schedule] Plan ${planId} not found`);
                throw new Error('Plan not found');
            }

            console.log(`[Schedule] Plan details:`, {
                id: plan._id,
                name: plan.name,
                start: plan.start,
                end: plan.end,
                status: plan.status,
                repeat: plan.repeat
            });

            // Nếu plan đã có trong map, hủy schedule cũ
            if (this.scheduleMap.has(planId)) {
                console.log(`[Schedule] Found existing schedule for plan ${planId}, stopping it`);
                this.stopPlanSchedule(planId);
            }

            // Nếu plan không có thời gian start/end, không cần schedule
            if (!plan.start || !plan.end) {
                console.log(`[Schedule] Plan ${planId} has no start/end time, skipping schedule`);
                return;
            }

            const now = new Date();
            const startTime = new Date(plan.start);
            const endTime = new Date(plan.end);

            console.log(`[Schedule] Time check for plan ${planId}:`, {
                now: now.toISOString(),
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                isAfterStart: now >= startTime,
                isBeforeEnd: now < endTime
            });

            // Kiểm tra nếu plan đã hết hạn
            if (now >= endTime) {
                console.log(`[Schedule] Plan ${planId} has expired`);
                await this.completePlan(plan._id);
                return;
            }

            // Nếu đang trong thời gian chạy hoặc đã qua thời gian start
            if (now >= startTime) {
                console.log(`[Schedule] Plan ${planId} should be active now, starting immediately`);
                await this.startPlan(plan);
            } 
            // Nếu thời gian start chưa đến
            else {
                const timeUntilStart = startTime.getTime() - now.getTime();
                console.log(`[Schedule] Setting start timeout for plan ${planId} in ${timeUntilStart}ms (${timeUntilStart / 1000 / 60} minutes)`);
                
                const startTimeout = setTimeout(() => {
                    console.log(`[Schedule] Start timeout triggered for plan ${planId}`);
                    this.startPlan(plan);
                }, timeUntilStart);

                this.scheduleMap.set(planId, {
                    startTimeout,
                    endTimeout: null,
                    status: 'scheduled',
                    repeat: plan.repeat
                });
                console.log(`[Schedule] Plan ${planId} scheduled to start at ${startTime}`);
            }

            // Log trạng thái cuối cùng
            const scheduleStatus = this.scheduleMap.get(planId);
            console.log(`[Schedule] Final schedule status for plan ${planId}:`, scheduleStatus);

        } catch (error) {
            console.error(`[Schedule] Error initializing schedule for plan ${planId}:`, error);
            throw error;
        }
    }

    // Bắt đầu chạy một plan
    async startPlan(plan) {
        try {
            console.log(`[Schedule] Starting plan ${plan._id}`);
            const now = new Date();
            const endTime = new Date(plan.end);
            const timeUntilEnd = endTime.getTime() - now.getTime();

            console.log(`[Schedule] Plan ${plan._id} details for start:`, {
                now: now.toISOString(),
                endTime: endTime.toISOString(),
                timeUntilEnd: `${timeUntilEnd}ms (${timeUntilEnd / 1000 / 60} minutes)`
            });

            // Set trạng thái plan thành active
            await Plan.findByIdAndUpdate(plan._id, { status: 'active' });
            console.log(`[Schedule] Updated plan ${plan._id} status to active`);

            // Tạo timeout để kết thúc plan
            const endTimeout = setTimeout(async () => {
                console.log(`[Schedule] End timeout triggered for plan ${plan._id}`);
                await this.completePlan(plan._id);
            }, timeUntilEnd);

            this.scheduleMap.set(plan._id, {
                startTimeout: null,
                endTimeout,
                status: 'active',
                repeat: plan.repeat
            });

            // Emit socket event để thông báo plan đã bắt đầu
            if (global.io) {
                global.io.emit('plan-started', { 
                    planId: plan._id,
                    campaigns: plan.campaigns,
                    maxPlaysPerHour: plan.maxPlaysPerHour,
                    locationAware: plan.locationAware,
                    priority: plan.priority
                });
                console.log(`[Schedule] Emitted plan-started event for plan ${plan._id}`);
            } else {
                console.log(`[Schedule] Warning: Socket.io not initialized, couldn't emit plan-started event`);
            }
            
            console.log(`[Schedule] Plan ${plan._id} started successfully with ${plan.campaigns?.length || 0} campaigns`);
        } catch (error) {
            console.error(`[Schedule] Error starting plan ${plan._id}:`, error);
            throw error;
        }
    }

    // Hoàn thành một plan
    async completePlan(planId) {
        try {
            console.log(`[Schedule] Completing plan ${planId}`);
            const plan = await Plan.findById(planId);
            if (!plan) {
                console.log(`[Schedule] Plan ${planId} not found during completion`);
                return;
            }

            // Update trạng thái plan
            await Plan.findByIdAndUpdate(planId, { status: 'completed' });
            console.log(`[Schedule] Updated plan ${planId} status to completed`);

            // Xóa các timeout
            this.stopPlanSchedule(planId);

            // Kiểm tra và tạo lịch mới nếu plan là repeat
            if (plan.repeat === 'Always') {
                console.log(`[Schedule] Plan ${planId} is set to repeat Always, calculating next schedule`);
                // Tính toán thời gian cho lần chạy tiếp theo
                const nextStart = this.calculateNextStartTime(plan);
                const nextEnd = this.calculateNextEndTime(plan, nextStart);

                console.log(`[Schedule] Next schedule for plan ${planId}:`, {
                    nextStart: nextStart.toISOString(),
                    nextEnd: nextEnd.toISOString()
                });

                // Cập nhật thời gian mới cho plan
                await Plan.findByIdAndUpdate(planId, {
                    start: nextStart,
                    end: nextEnd,
                    status: 'pending'
                });

                // Khởi tạo schedule mới
                await this.initializePlanSchedule(planId);
            }

            // Emit socket event để thông báo plan đã kết thúc
            if (global.io) {
                global.io.emit('plan-ended', { planId });
                console.log(`[Schedule] Emitted plan-ended event for plan ${planId}`);
            } else {
                console.log(`[Schedule] Warning: Socket.io not initialized, couldn't emit plan-ended event`);
            }
            
            console.log(`[Schedule] Plan ${planId} completed successfully`);
        } catch (error) {
            console.error(`[Schedule] Error completing plan ${planId}:`, error);
            throw error;
        }
    }

    // Tính toán thời gian bắt đầu tiếp theo cho plan lặp lại
    calculateNextStartTime(plan) {
        const currentStart = new Date(plan.start);
        const nextStart = new Date(currentStart);
        nextStart.setDate(nextStart.getDate() + 1);
        return nextStart;
    }

    // Tính toán thời gian kết thúc tiếp theo dựa trên start time mới
    calculateNextEndTime(plan, nextStart) {
        const currentStart = new Date(plan.start);
        const currentEnd = new Date(plan.end);
        const duration = currentEnd.getTime() - currentStart.getTime();
        return new Date(nextStart.getTime() + duration);
    }

    // Hủy schedule của một plan
    stopPlanSchedule(planId) {
        console.log(`[Schedule] Stopping schedule for plan ${planId}`);
        const schedule = this.scheduleMap.get(planId);
        if (schedule) {
            if (schedule.startTimeout) {
                clearTimeout(schedule.startTimeout);
                console.log(`[Schedule] Cleared start timeout for plan ${planId}`);
            }
            if (schedule.endTimeout) {
                clearTimeout(schedule.endTimeout);
                console.log(`[Schedule] Cleared end timeout for plan ${planId}`);
            }
            this.scheduleMap.delete(planId);
            console.log(`[Schedule] Removed schedule from map for plan ${planId}`);
        } else {
            console.log(`[Schedule] No active schedule found for plan ${planId}`);
        }
    }

    // Khởi tạo lại tất cả các plan schedule
    async initializeAllSchedules() {
        try {
            console.log('[Schedule] Initializing all schedules');
            const plans = await Plan.find({
                status: { $in: ['pending', 'active'] },
                start: { $exists: true },
                end: { $exists: true },
                end: { $gt: new Date() }
            });

            console.log(`[Schedule] Found ${plans.length} plans to initialize`);
            for (const plan of plans) {
                try {
                    await this.initializePlanSchedule(plan._id);
                } catch (error) {
                    console.error(`[Schedule] Error initializing plan ${plan._id}:`, error);
                    // Continue with next plan even if one fails
                }
            }
            console.log('[Schedule] Finished initializing all schedules');
        } catch (error) {
            console.error('[Schedule] Error initializing all schedules:', error);
            throw error;
        }
    }
}

module.exports = new ScheduleService(); 