import React, { useEffect, useState } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Camera,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { apiFetchOrThrow, extractResponseData } from "../../utils/api";

export default function ProfileModal({
  isOpen,
  onClose,
  initialMode = "view",
}) {
  const { userData, fetchDetailedProfile, updateProfile, setUserData } =
    useAppContext();

  const [mode, setMode] = useState(initialMode);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "",
    school_name: "",
    phone_number: "",
    gender: "",
    date_of_birth: "",
    address: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        setStatusMessage("");

        const detailed = await fetchDetailedProfile();

        if (!isMounted || !detailed) return;

        setUserData((prev) => ({ ...prev, ...detailed }));
        setFormData({
          full_name: detailed.full_name || "",
          email: detailed.email || "",
          role: detailed.role || "",
          school_name: detailed.school_name || "",
          phone_number: detailed.phone_number || "",
          gender: detailed.gender || "",
          date_of_birth: detailed.date_of_birth
            ? String(detailed.date_of_birth).slice(0, 10)
            : "",
          address: detailed.address || "",
          bio: detailed.bio || "",
          avatar_url: detailed.avatar_url || "",
        });
      } catch (err) {
        setStatusMessage(`❌ ${err.message || "Unable to load profile."}`);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, fetchDetailedProfile, setUserData]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStatusMessage("");
    } else {
      setMode("view");
      setStatusMessage("");
    }
  }, [isOpen, initialMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        file.type,
      )
    ) {
      setStatusMessage("❌ Only JPG, PNG, and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage("❌ Avatar file is too large. Maximum size is 2MB.");
      e.target.value = "";
      return;
    }

    const data = new FormData();
    data.append("avatar", file);

    try {
      setUploadingAvatar(true);
      setStatusMessage("");

      const payload = await apiFetchOrThrow(
        "/users/avatar",
        {
          method: "POST",
          body: data,
        },
        "Avatar upload failed.",
      );

      const updatedUser = extractResponseData(payload, {});

      setUserData((prev) => ({
        ...prev,
        ...updatedUser,
      }));

      setFormData((prev) => ({
        ...prev,
        avatar_url: updatedUser.avatar_url || prev.avatar_url,
      }));

      setStatusMessage("✅ Avatar updated successfully.");
    } catch (err) {
      setStatusMessage(`❌ ${err.message || "Unable to upload avatar."}`);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setStatusMessage("");

      const payload = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        bio: formData.bio,
      };

      const updated = await updateProfile(payload);

      setFormData((prev) => ({
        ...prev,
        full_name: updated?.full_name || prev.full_name,
        phone_number: updated?.phone_number || "",
        gender: updated?.gender || "",
        date_of_birth: updated?.date_of_birth
          ? String(updated.date_of_birth).slice(0, 10)
          : "",
        address: updated?.address || "",
        bio: updated?.bio || "",
      }));

      setStatusMessage("✅ Profile updated successfully.");
      setMode("view");
    } catch (err) {
      setStatusMessage(`❌ ${err.message || "Unable to save profile."}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const userInitial = userData?.full_name?.charAt(0)?.toUpperCase() || "U";
  const avatarUrl = formData.avatar_url || userData?.avatar_url || "";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {mode === "edit" ? "Edit Profile" : "Profile"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and manage your personal information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {statusMessage && (
          <div className="px-6 pt-4">
            <div className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
              {statusMessage}
            </div>
          </div>
        )}

        {loadingProfile ? (
          <div className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400">
            Loading profile...
          </div>
        ) : (
          <>
            <div className="px-6 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative w-20 h-20 shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${formData.full_name || "User"} avatar`}
                      className="w-20 h-20 rounded-full object-cover shadow-lg border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                      {userInitial}
                    </div>
                  )}

                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-colors disabled:opacity-60">
                    <Camera size={15} />
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {formData.full_name || "Unnamed User"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {formData.email || "No email available"}
                  </p>
                  <p className="text-xs mt-1 font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {formData.role}
                  </p>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                    {formData.school_name}
                  </p>
                  <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                    {uploadingAvatar
                      ? "Uploading avatar..."
                      : "Click the camera icon to change avatar"}
                  </p>
                </div>
              </div>
            </div>

            {mode === "view" ? (
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard
                    icon={<User size={16} />}
                    label="Full Name"
                    value={formData.full_name}
                  />
                  <InfoCard
                    icon={<Mail size={16} />}
                    label="Email"
                    value={formData.email}
                  />
                  <InfoCard
                    icon={<Phone size={16} />}
                    label="Phone Number"
                    value={formData.phone_number}
                  />
                  <InfoCard
                    icon={<Calendar size={16} />}
                    label="Date of Birth"
                    value={formData.date_of_birth}
                  />
                  <InfoCard
                    icon={<User size={16} />}
                    label="Gender"
                    value={formData.gender}
                  />
                  <InfoCard
                    icon={<MapPin size={16} />}
                    label="Address"
                    value={formData.address}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <FileText size={16} />
                    Bio
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {formData.bio || "No bio added yet."}
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="px-6 py-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />

                  <Field
                    label="Phone Number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <Field
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </div>

                <Field
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Tell us a bit about yourself"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode("view")}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
        {icon}
        {label}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
        {value || "Not added yet"}
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />
    </div>
  );
}
