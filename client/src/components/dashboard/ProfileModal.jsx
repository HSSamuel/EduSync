import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Camera,
  Shield,
  Building2,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { apiFetchOrThrow, extractResponseData } from "../../utils/api";

const EMPTY_FORM = {
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
};

const formatDateInput = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const formatDateDisplay = (value) => {
  if (!value) return "Not added";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export default function ProfileModal({
  isOpen,
  onClose,
  initialMode = "view",
}) {
  const { userData, fetchDetailedProfile, updateProfile, setUserData } =
    useAppContext();

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  const [mode, setMode] = useState(initialMode);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [formData, setFormData] = useState(EMPTY_FORM);

  const compactProfile = useMemo(() => {
    const source = userData || {};
    return {
      full_name: source.full_name || "",
      email: source.email || "",
      role: source.role || "",
      school_name: source.school_name || "",
      phone_number: source.phone_number || "",
      gender: source.gender || "",
      date_of_birth: formatDateInput(source.date_of_birth),
      address: source.address || "",
      bio: source.bio || "",
      avatar_url: source.avatar_url || "",
    };
  }, [userData]);

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
          date_of_birth: formatDateInput(detailed.date_of_birth),
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

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (mode === "edit") {
          setMode("view");
          setStatusMessage("");
          setFormData((prev) => ({
            ...prev,
            full_name: compactProfile.full_name,
            email: compactProfile.email,
            role: compactProfile.role,
            school_name: compactProfile.school_name,
            phone_number: compactProfile.phone_number,
            gender: compactProfile.gender,
            date_of_birth: compactProfile.date_of_birth,
            address: compactProfile.address,
            bio: compactProfile.bio,
            avatar_url: prev.avatar_url || compactProfile.avatar_url,
          }));
        } else {
          onClose?.();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, mode, onClose, compactProfile]);

  useEffect(() => {
    if (isOpen && mode === "edit" && firstInputRef.current) {
      const timer = setTimeout(() => firstInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose?.();
    }
  };

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

      setStatusMessage("✅ Avatar updated.");
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
        date_of_birth: formatDateInput(updated?.date_of_birth),
        address: updated?.address || "",
        bio: updated?.bio || "",
      }));

      setStatusMessage("✅ Profile updated.");
      setMode("view");
    } catch (err) {
      setStatusMessage(`❌ ${err.message || "Unable to save profile."}`);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData((prev) => ({
      ...prev,
      full_name: compactProfile.full_name,
      email: compactProfile.email,
      role: compactProfile.role,
      school_name: compactProfile.school_name,
      phone_number: compactProfile.phone_number,
      gender: compactProfile.gender,
      date_of_birth: compactProfile.date_of_birth,
      address: compactProfile.address,
      bio: compactProfile.bio,
      avatar_url: prev.avatar_url || compactProfile.avatar_url,
    }));
    setStatusMessage("");
    setMode("view");
  };

  if (!isOpen) return null;

  const avatarUrl = formData.avatar_url || userData?.avatar_url || "";
  const initials = getInitials(formData.full_name || userData?.full_name || "");
  const title = mode === "edit" ? "Edit Profile" : "Profile";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={modalRef}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-[100dvh] w-full flex-col overflow-hidden rounded-none bg-white shadow-2xl dark:bg-gray-950 sm:h-auto sm:max-h-[88vh] sm:max-w-4xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-4">
          <div className="pr-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {statusMessage ? (
          <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-800 sm:px-5">
            <div className="rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:text-sm">
              {statusMessage}
            </div>
          </div>
        ) : null}

        {loadingProfile ? (
          <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 sm:px-5">
            Loading profile...
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="border-b border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/40 sm:px-5 lg:border-b-0 lg:border-r">
                <div className="flex items-center gap-3 lg:block">
                  <div className="relative mx-auto lg:mx-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${formData.full_name || "User"} avatar`}
                        className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white shadow-md dark:ring-gray-900 sm:h-20 sm:w-20"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-md sm:h-20 sm:w-20 sm:text-2xl">
                        {initials}
                      </div>
                    )}

                    <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition hover:bg-blue-700">
                      <Camera size={14} />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>

                  <div className="min-w-0 flex-1 pt-0 lg:pt-3">
                    <h3 className="truncate text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                      {formData.full_name || "Unnamed User"}
                    </h3>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                      {formData.email || "No email"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.role ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                          <Shield size={11} />
                          {formData.role}
                        </span>
                      ) : null}

                      {formData.school_name ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <Building2 size={11} />
                          <span className="max-w-[120px] truncate">
                            {formData.school_name}
                          </span>
                        </span>
                      ) : null}
                    </div>

                    {uploadingAvatar && (
                      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                        Uploading avatar...
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
                  <MiniStat
                    label="Gender"
                    value={formData.gender || "Not set"}
                  />
                  <MiniStat
                    label="Phone"
                    value={formData.phone_number || "Not set"}
                  />
                </div>
              </aside>

              <main className="flex min-h-0 flex-col">
                {mode === "view" ? (
                  <>
                    <div className="flex-1 px-4 py-4 sm:px-5 sm:py-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                            Details
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                            Profile summary.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setMode("edit")}
                          className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 sm:px-4 sm:text-sm"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InfoCard
                          icon={<User size={14} />}
                          label="Full Name"
                          value={formData.full_name}
                        />
                        <InfoCard
                          icon={<Mail size={14} />}
                          label="Email"
                          value={formData.email}
                        />
                        <InfoCard
                          icon={<Phone size={14} />}
                          label="Phone"
                          value={formData.phone_number}
                        />
                        <InfoCard
                          icon={<Calendar size={14} />}
                          label="Date of Birth"
                          value={formatDateDisplay(formData.date_of_birth)}
                        />
                        <InfoCard
                          icon={<User size={14} />}
                          label="Gender"
                          value={formData.gender}
                        />
                        <InfoCard
                          icon={<MapPin size={14} />}
                          label="Address"
                          value={formData.address}
                        />
                        <InfoCard
                          icon={<FileText size={14} />}
                          label="Bio"
                          value={formData.bio || "No bio added yet."}
                          fullWidth
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950 sm:px-5">
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900 sm:text-sm"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode("edit")}
                          className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 sm:text-sm"
                        >
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <form
                    onSubmit={handleSave}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    <div className="flex-1 px-4 py-4 sm:px-5 sm:py-5">
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                          Edit Details
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                          Short, responsive form for desktop and mobile.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field
                          ref={firstInputRef}
                          label="Full Name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          required
                        />

                        <Field
                          label="Phone"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleChange}
                        />

                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
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

                        <div className="sm:col-span-2">
                          <Field
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
                            Bio
                          </label>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Tell us a bit about yourself"
                            className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950 sm:px-5">
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900 sm:text-sm"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </main>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-800 dark:bg-gray-950">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-medium text-gray-800 dark:text-gray-200 sm:text-sm">
        {value}
      </p>
    </div>
  );
}

function InfoCard({ icon, label, value, fullWidth = false }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950 sm:p-4 ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 sm:text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <p className="break-words text-xs leading-5 text-gray-600 dark:text-gray-300 sm:text-sm">
        {value || "Not added"}
      </p>
    </div>
  );
}

const Field = React.forwardRef(function Field(
  { label, name, value, onChange, type = "text", required = false },
  ref,
) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
        {label}
      </label>
      <input
        ref={ref}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
      />
    </div>
  );
});