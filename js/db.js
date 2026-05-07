const DB_KEYS = {
    USERS: 'gatepass_users',
    PASSES: 'gatepass_requests',
    SESSION: 'gatepass_current_user',
    THEME: 'gatepass_theme',
    COMPLAINTS: 'hostel_complaints',
    FEES: 'hostel_fees',
    FOOD_MENU: 'hostel_food_menu',
    NOTICES: 'hostel_notices',
    ATTENDANCE: 'hostel_attendance',
    NOTIFICATIONS: 'hostel_notifications',
    LAUNDRY: 'hostel_laundry',
    VISITORS: 'hostel_visitors',
    ROOMS: 'hostel_rooms',
    PARCELS: 'hostel_parcels',
    LOST_FOUND: 'hostel_lost_found'
};

// Initial Dummy Data
const DUMMY_USERS = [
    { id: 'S001', name: 'John Doe', role: 'student', password: 'password', room: 'A-101', phone: '1234567890' },
    { id: 'S002', name: 'Jane Smith', role: 'student', password: 'password', room: 'B-205', phone: '0987654321' },
    { id: 'W001', name: 'Warden Smith', role: 'warden', password: 'password' },
    { id: 'G001', name: 'Guard Mike', role: 'guard', password: 'password' }
];

const DB = {
    init: () => {
        if (!localStorage.getItem(DB_KEYS.USERS)) {
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DUMMY_USERS));
        }
        if (!localStorage.getItem(DB_KEYS.PASSES)) {
            localStorage.setItem(DB_KEYS.PASSES, JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_KEYS.THEME)) {
            localStorage.setItem(DB_KEYS.THEME, 'light');
        }
        if (!localStorage.getItem(DB_KEYS.COMPLAINTS)) {
            localStorage.setItem(DB_KEYS.COMPLAINTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_KEYS.FEES)) {
            // Mock fees data for students
            const dummyFees = [
                { studentId: 'S001', totalDue: 5000, paid: 2000, history: [{ date: new Date().toISOString(), amount: 2000, method: 'Card' }], fines: [] },
                { studentId: 'S002', totalDue: 5000, paid: 5000, history: [{ date: new Date().toISOString(), amount: 5000, method: 'UPI' }], fines: [] }
            ];
            localStorage.setItem(DB_KEYS.FEES, JSON.stringify(dummyFees));
        }
        if (!localStorage.getItem(DB_KEYS.FOOD_MENU)) {
            const dummyFoodMenu = {
                monday: { breakfast: 'Poha & Tea', lunch: 'Dal, Rice, Roti, Sabzi', dinner: 'Paneer Masala, Rice' },
                tuesday: { breakfast: 'Idli Sambar', lunch: 'Rajma, Rice, Roti', dinner: 'Veg Biryani' },
                wednesday: { breakfast: 'Aloo Paratha', lunch: 'Dal Tadka, Rice, Mix Veg', dinner: 'Chole Bhature' },
                thursday: { breakfast: 'Upma & Coffee', lunch: 'Kadhi Pakora, Rice, Roti', dinner: 'Egg Curry/Veg Kurma' },
                friday: { breakfast: 'Dosa & Chutney', lunch: 'Dal Makhani, Jeera Rice', dinner: 'Fried Rice & Manchurian' },
                saturday: { breakfast: 'Puri Sabzi', lunch: 'Khichdi, Kadhi', dinner: 'Pulao & Raita' },
                sunday: { breakfast: 'Bread Omelet/Jam', lunch: 'Special Thali', dinner: 'Noodles & Soup' }
            };
            localStorage.setItem(DB_KEYS.FOOD_MENU, JSON.stringify(dummyFoodMenu));
        }
        if (!localStorage.getItem(DB_KEYS.NOTICES)) {
            const dummyNotices = [
                { id: 'N-001', title: 'Water Supply Issue', content: 'Water supply will be interrupted tomorrow from 10 AM to 12 PM due to maintenance.', date: new Date().toISOString(), author: 'W001' }
            ];
            localStorage.setItem(DB_KEYS.NOTICES, JSON.stringify(dummyNotices));
        }
        if (!localStorage.getItem(DB_KEYS.ATTENDANCE)) {
            localStorage.setItem(DB_KEYS.ATTENDANCE, JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_KEYS.NOTIFICATIONS)) {
            localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_KEYS.LAUNDRY)) {
            localStorage.setItem(DB_KEYS.LAUNDRY, JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_KEYS.VISITORS)) {
            localStorage.setItem(DB_KEYS.VISITORS, JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_KEYS.ROOMS)) {
            const dummyRooms = [
                { roomNo: 'A-101', capacity: 2, occupants: ['S001'], inventory: { beds: 2, tables: 2, chairs: 2 } },
                { roomNo: 'B-205', capacity: 2, occupants: ['S002'], inventory: { beds: 2, tables: 2, chairs: 2 } },
                { roomNo: 'C-302', capacity: 3, occupants: [], inventory: { beds: 3, tables: 3, chairs: 3 } }
            ];
            localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify(dummyRooms));
        }
        if (!localStorage.getItem(DB_KEYS.PARCELS)) {
            localStorage.setItem(DB_KEYS.PARCELS, JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_KEYS.LOST_FOUND)) {
            localStorage.setItem(DB_KEYS.LOST_FOUND, JSON.stringify([]));
        }
    },
    
    getUsers: () => JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]'),
    
    getUserById: (id) => {
        const users = DB.getUsers();
        return users.find(u => u.id === id);
    },
    
    addUser: (user) => {
        const users = DB.getUsers();
        if (users.find(u => u.id === user.id)) {
            return false;
        }
        users.push(user);
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
        return true;
    },
    
    getPasses: () => JSON.parse(localStorage.getItem(DB_KEYS.PASSES) || '[]'),
    
    savePasses: (passes) => {
        localStorage.setItem(DB_KEYS.PASSES, JSON.stringify(passes));
    },
    
    addPass: (pass) => {
        const passes = DB.getPasses();
        passes.push(pass);
        DB.savePasses(passes);
    },
    
    updatePass: (updatedPass) => {
        const passes = DB.getPasses();
        const index = passes.findIndex(p => p.id === updatedPass.id);
        if (index !== -1) {
            passes[index] = updatedPass;
            DB.savePasses(passes);
        }
    },
    
    getPassById: (id) => {
        const passes = DB.getPasses();
        return passes.find(p => p.id === id);
    },

    // Complaints
    getComplaints: () => JSON.parse(localStorage.getItem(DB_KEYS.COMPLAINTS) || '[]'),
    saveComplaints: (complaints) => localStorage.setItem(DB_KEYS.COMPLAINTS, JSON.stringify(complaints)),
    addComplaint: (complaint) => {
        const complaints = DB.getComplaints();
        complaints.push(complaint);
        DB.saveComplaints(complaints);
    },
    updateComplaint: (updated) => {
        const complaints = DB.getComplaints();
        const index = complaints.findIndex(c => c.id === updated.id);
        if (index !== -1) {
            complaints[index] = updated;
            DB.saveComplaints(complaints);
        }
    },

    // Fees
    getFees: () => JSON.parse(localStorage.getItem(DB_KEYS.FEES) || '[]'),
    saveFees: (fees) => localStorage.setItem(DB_KEYS.FEES, JSON.stringify(fees)),
    updateStudentFee: (studentId, amount, method) => {
        const fees = DB.getFees();
        const feeData = fees.find(f => f.studentId === studentId);
        if (feeData) {
            feeData.paid += amount;
            feeData.history.push({ date: new Date().toISOString(), amount, method });
            DB.saveFees(fees);
        }
    },
    issueFine: (studentId, amount, reason) => {
        const fees = DB.getFees();
        let feeData = fees.find(f => f.studentId === studentId);
        if (!feeData) {
            feeData = { studentId, totalDue: 0, paid: 0, history: [], fines: [] };
            fees.push(feeData);
        }
        if (!feeData.fines) feeData.fines = [];
        feeData.totalDue += amount;
        feeData.fines.push({ date: new Date().toISOString(), amount, reason });
        DB.saveFees(fees);
    },

    // Food Menu
    getFoodMenu: () => JSON.parse(localStorage.getItem(DB_KEYS.FOOD_MENU) || '{}'),
    saveFoodMenu: (menu) => localStorage.setItem(DB_KEYS.FOOD_MENU, JSON.stringify(menu)),

    // Notices
    getNotices: () => JSON.parse(localStorage.getItem(DB_KEYS.NOTICES) || '[]'),
    saveNotices: (notices) => localStorage.setItem(DB_KEYS.NOTICES, JSON.stringify(notices)),
    addNotice: (notice) => {
        const notices = DB.getNotices();
        notices.push(notice);
        DB.saveNotices(notices);
    },
    deleteNotice: (id) => {
        const notices = DB.getNotices();
        DB.saveNotices(notices.filter(n => n.id !== id));
    },

    // Attendance
    getAttendance: () => JSON.parse(localStorage.getItem(DB_KEYS.ATTENDANCE) || '[]'),
    saveAttendance: (attendance) => localStorage.setItem(DB_KEYS.ATTENDANCE, JSON.stringify(attendance)),
    addAttendanceRecord: (record) => {
        const attendance = DB.getAttendance();
        attendance.push(record);
        DB.saveAttendance(attendance);
    },

    // Notifications
    getNotifications: (userId) => {
        const all = JSON.parse(localStorage.getItem(DB_KEYS.NOTIFICATIONS) || '[]');
        return all.filter(n => n.userId === userId).sort((a,b) => new Date(b.date) - new Date(a.date));
    },
    addNotification: (notification) => {
        const notifications = JSON.parse(localStorage.getItem(DB_KEYS.NOTIFICATIONS) || '[]');
        notifications.push({
            id: 'NOTIF-' + Date.now(),
            date: new Date().toISOString(),
            read: false,
            ...notification
        });
        localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    },
    markNotificationRead: (id) => {
        const notifications = JSON.parse(localStorage.getItem(DB_KEYS.NOTIFICATIONS) || '[]');
        const n = notifications.find(n => n.id === id);
        if (n) {
            n.read = true;
            localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        }
    },

    // Laundry
    getLaundry: () => JSON.parse(localStorage.getItem(DB_KEYS.LAUNDRY) || '[]'),
    saveLaundry: (laundry) => localStorage.setItem(DB_KEYS.LAUNDRY, JSON.stringify(laundry)),
    addLaundry: (batch) => {
        const laundry = DB.getLaundry();
        laundry.push(batch);
        DB.saveLaundry(laundry);
    },
    updateLaundry: (updatedBatch) => {
        const laundry = DB.getLaundry();
        const index = laundry.findIndex(l => l.id === updatedBatch.id);
        if (index !== -1) {
            laundry[index] = updatedBatch;
            DB.saveLaundry(laundry);
        }
    },

    // Visitors
    getVisitors: () => JSON.parse(localStorage.getItem(DB_KEYS.VISITORS) || '[]'),
    saveVisitors: (visitors) => localStorage.setItem(DB_KEYS.VISITORS, JSON.stringify(visitors)),
    addVisitor: (visitor) => {
        const visitors = DB.getVisitors();
        visitors.push(visitor);
        DB.saveVisitors(visitors);
    },
    updateVisitor: (updatedVisitor) => {
        const visitors = DB.getVisitors();
        const index = visitors.findIndex(v => v.id === updatedVisitor.id);
        if (index !== -1) {
            visitors[index] = updatedVisitor;
            DB.saveVisitors(visitors);
        }
    },

    // Rooms
    getRooms: () => JSON.parse(localStorage.getItem(DB_KEYS.ROOMS) || '[]'),
    saveRooms: (rooms) => localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify(rooms)),
    updateRoom: (updatedRoom) => {
        const rooms = DB.getRooms();
        const index = rooms.findIndex(r => r.roomNo === updatedRoom.roomNo);
        if (index !== -1) {
            rooms[index] = updatedRoom;
            DB.saveRooms(rooms);
        }
    },

    // Parcels
    getParcels: () => JSON.parse(localStorage.getItem(DB_KEYS.PARCELS) || '[]'),
    saveParcels: (parcels) => localStorage.setItem(DB_KEYS.PARCELS, JSON.stringify(parcels)),
    addParcel: (parcel) => {
        const parcels = DB.getParcels();
        parcels.push(parcel);
        DB.saveParcels(parcels);
    },
    updateParcel: (updatedParcel) => {
        const parcels = DB.getParcels();
        const index = parcels.findIndex(p => p.id === updatedParcel.id);
        if (index !== -1) {
            parcels[index] = updatedParcel;
            DB.saveParcels(parcels);
        }
    },

    // Lost & Found
    getLostFound: () => JSON.parse(localStorage.getItem(DB_KEYS.LOST_FOUND) || '[]'),
    saveLostFound: (items) => localStorage.setItem(DB_KEYS.LOST_FOUND, JSON.stringify(items)),
    addLostFound: (item) => {
        const items = DB.getLostFound();
        items.push(item);
        DB.saveLostFound(items);
    },
    updateLostFound: (updatedItem) => {
        const items = DB.getLostFound();
        const index = items.findIndex(i => i.id === updatedItem.id);
        if (index !== -1) {
            items[index] = updatedItem;
            DB.saveLostFound(items);
        }
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem(DB_KEYS.SESSION);
        return userStr ? JSON.parse(userStr) : null;
    },

    setCurrentUser: (user) => {
        localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
    },

    clearSession: () => {
        localStorage.removeItem(DB_KEYS.SESSION);
    }
};

// Initialize DB on script load
DB.init();
